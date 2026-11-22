import { Assets, Ticker, UPDATE_PRIORITY } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import {
  Container3D,
  Matrix4,
  Mesh3D as PixiMesh3D,
  Model3D as PixiModel3D,
  Quaternion,
  Vector3,
  type AnimationState,
  type Scene3DSource,
} from "@pixi/3d";
import { findViewComponent, Node3D, type Node3DProps } from "./Node3D";
import { applyDissolve, normalizeDissolve, withDissolveBit, type DissolveInput } from "./dissolve";
import { BaseMaterial3D } from "@pixi/3d";
import type { MaterialSpec } from "./builders";

// Scratch values for the bone followers, reused every frame
const followMatrix = new Matrix4();
const boneMatrix = new Matrix4();
const followResult = new Matrix4();
const followPosition = new Vector3();
const followRotation = new Quaternion();
const followScale = new Vector3();

export interface BlendLayer {
  /** Clip name */
  clip: string;
  /** Share of this clip in the mix; weights are relative to each other. Default 1 */
  weight?: number;
  /** Playback speed. Default 1 */
  speed?: number;
  /** Default true */
  loop?: boolean;
}

/** How many Model3D components use each loaded URL, to unload a file nobody uses. */
const sourceUsers = new Map<string, number>();

function retainSource(url: string) {
  sourceUsers.set(url, (sourceUsers.get(url) ?? 0) + 1);
}

function releaseSource(url: string) {
  const count = (sourceUsers.get(url) ?? 1) - 1;
  if (count > 0) {
    sourceUsers.set(url, count);
    return;
  }
  sourceUsers.delete(url);
  Assets.unload(url).catch(() => {});
}

export interface Model3DProps extends Node3DProps {
  /** URL of a .glb / .gltf file, or an already loaded Scene3DSource */
  src?: string | Scene3DSource;
  /** Name of the animation clip to play; changing it cross-fades to the new clip */
  animation?: string | null;
  /** Cross-fade duration in seconds when `animation` changes (default 0.25, 0 to cut) */
  fadeDuration?: number;
  /** Whether the clip loops (default true) */
  loop?: boolean;
  /** Playback speed multiplier (default 1) */
  animationSpeed?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /**
   * Morph target weights, written into every mesh that has morph targets: an array
   * (`[0.8, 0]`), or `{ meshLabel: [...] }` for one mesh. A playing clip that animates
   * the weights overwrites them.
   */
  morphWeights?: number[] | Record<string, number[]>;
  /** Unloads the file when no Model3D uses it any more. Default `true` */
  unload?: boolean;
  /** Cuts the model away with noise: 0 whole, 1 gone, or `{ amount, edgeColor, edgeStrength, holeSize }` */
  dissolve?: DissolveInput;
  /** Called when a clip that does not loop reaches its end, with the clip name */
  onAnimationEnd?: (clip: string) => void;
  /** Called each time a looping clip starts over, with the clip name */
  onAnimationLoop?: (clip: string) => void;
  /** Name of the scene to build, for a file with several. Default: the file's main scene */
  scene?: string;
  /**
   * Changes to the model's materials: `{ materialName: { baseColor, roughness... } }`,
   * `{ materialName: material }`, or `(material) => material`. This model only.
   */
  materials?: Record<string, MaterialSpec | BaseMaterial3D> | ((material: BaseMaterial3D) => BaseMaterial3D);
  /**
   * Several clips at once, mixed by weight: `[{ clip: "Walking", weight: 0.7 }, { clip: "Wave", weight: 0.3 }]`.
   * While set, it replaces `animation`.
   */
  blend?: BlendLayer[];
  /** Looks through a camera from the file: its name, its index, or `true` for the first */
  useCamera?: string | number | boolean;
  /** Called once the model is built */
  onLoad?: (model: PixiModel3D) => void;
}

/**
 * Wraps a loaded glTF. The component is a Container3D holding the Model3D, so
 * transforms and children work before the file has loaded.
 */
class CanvasModel3D extends Node3D(Container3D) {
  model: PixiModel3D | null = null;
  #loadVersion = 0;
  #clip: string | null = null;
  #state: AnimationState | null = null;
  #fade: ((ticker: Ticker) => void) | null = null;
  #sourceUrl: string | null = null;
  /** Nodes following a bone, with the `bone` prop on a child */
  #boneChildren = new Map<Container3D, string>();

  applyProps3D(props: Model3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (props.src !== undefined || (!initial && "scene" in props && this.fullProps.src)) this.#load(this.fullProps.src);
    else if (this.model) {
      if ("blend" in props) this.#syncBlend();
      else if (props.animation !== undefined && !this.fullProps.blend) this.#play();
      if ("materials" in props) this.#applyMaterialOverrides();
      if ("useCamera" in props) this.#syncCamera();
      if (this.#state && props.loop !== undefined) this.#state.loop = props.loop;
      if (this.#state && props.animationSpeed !== undefined) this.#state.animationSpeed = props.animationSpeed;
      if (props.castShadow !== undefined || props.receiveShadow !== undefined) this.#applyShadows();
      if ("dissolve" in props) this.#syncDissolve();
      if (props.morphWeights !== undefined) {
        this.#applyMorphWeights();
        this.#syncMorphTick();
      }
    }
  }

  /**
   * Makes `node` follow the bone named `bone`. The node's own position, rotation and
   * scale are an offset from the bone, in the model's units and axes.
   *
   * A bone that is a scene node holds the node directly. A bone that exists only in a
   * skeleton is copied each frame into a follower node of this component.
   */
  attachToBone(node: Container3D, bone: string) {
    this.#boneChildren.set(node, bone);
    if (this.model) this.#placeOnBone(node, bone);
  }

  detachFromBone(node: Container3D) {
    this.#boneChildren.delete(node);
    const socket = this.#sockets.get(node);
    if (socket) {
      this.#sockets.delete(node);
      socket.parent?.removeChild(socket);
      if (node.parent === socket) socket.removeChild(node);
      socket.destroy();
    }
    this.#removeFollower(node);
  }

  /** Bone sockets: nodes that cancel a bone's rest rotation and scale, one per attached node */
  #sockets = new Map<Container3D, Container3D>();
  /** Followers of skeleton-only bones, updated each frame */
  #followers = new Map<Container3D, { follower: Container3D; skeleton: any; index: number; skinned: Container3D }>();
  #followTick = () => this.#updateFollowers();
  #followTickActive = false;

  #placeOnBone(node: Container3D, bone: string) {
    const sceneBone = this.model?.getChildByLabel(bone, true) as Container3D | null;
    let target: Container3D | null = sceneBone;
    this.#removeFollower(node);
    if (!target) target = this.#createFollower(node, bone);
    if (!target) {
      console.warn(`<Model3D> no bone named "${bone}". Available: ${this.#boneNames().join(", ")}`);
      return;
    }
    // A bone often has its own rotation and a large scale (FBX exports): a socket under
    // it cancels both, as they are now, so the node's offset reads in model units and axes
    const boneInModel = new Matrix4()
      .getInverse((this as unknown as Container3D).getGlobalTransform())
      .multiply(target.getGlobalTransform());
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    boneInModel.decompose(position, rotation, scale);

    let socket = this.#sockets.get(node);
    if (!socket) {
      socket = new Container3D({ label: `${bone}:socket` });
      this.#sockets.set(node, socket);
    }
    target.addChild(socket);
    socket.quaternion.copyFrom(rotation.inverse());
    socket.scale.set(1 / scale.x, 1 / scale.y, 1 / scale.z);
    if (node.parent !== socket) socket.addChild(node);
  }

  /** Finds `bone` in a skeleton and adds a follower node that copies its pose. */
  #createFollower(node: Container3D, bone: string): Container3D | null {
    for (const skeleton of this.model?.skeletons ?? []) {
      const index = (skeleton as any)._labelToIndex?.[bone];
      if (index === undefined) continue;
      // Skinned meshes are drawn in their own space: the skeleton's poses are relative to it
      let skinned: Container3D | null = null;
      this.model!.traverse((child: any) => {
        if (!skinned && child instanceof PixiMesh3D && child.skeleton === skeleton) skinned = child;
      });
      if (!skinned) continue;
      const follower = new Container3D({ label: `${bone}:follower` });
      this.addChild(follower);
      this.#followers.set(node, { follower, skeleton, index, skinned });
      this.#updateFollowers();
      if (!this.#followTickActive) {
        // After the animation player, which runs at normal priority
        Ticker.shared.add(this.#followTick, undefined, UPDATE_PRIORITY.LOW);
        this.#followTickActive = true;
      }
      return follower;
    }
    return null;
  }

  #removeFollower(node: Container3D) {
    const entry = this.#followers.get(node);
    if (!entry) return;
    this.#followers.delete(node);
    entry.follower.parent?.removeChild(entry.follower);
    entry.follower.destroy();
    if (this.#followers.size === 0 && this.#followTickActive) {
      Ticker.shared.remove(this.#followTick);
      this.#followTickActive = false;
    }
  }

  /** Copies each followed bone's pose, in this component's space, into its follower. */
  #updateFollowers() {
    if (this.#followers.size === 0) return;
    const toLocal = followMatrix.getInverse((this as unknown as Container3D).getGlobalTransform());
    for (const { follower, skeleton, index, skinned } of this.#followers.values()) {
      // Syncs bones bound to containers and recomputes the poses, if the pose changed
      skeleton.updateWorld();
      boneMatrix.fromArray(skeleton._nodeWorldMatrix, index * 16);
      followResult.copyFrom(toLocal).multiply(skinned.getGlobalTransform()).multiply(boneMatrix);
      followResult.decompose(followPosition, followRotation, followScale);
      follower.position.copyFrom(followPosition);
      follower.quaternion.copyFrom(followRotation);
      follower.scale.copyFrom(followScale);
    }
  }

  /** Bone names for the warning: scene-node bones, then skeleton bones. */
  #boneNames(): string[] {
    const names = new Set<string>();
    this.model?.traverse((child: any) => {
      if (child.label && !(child instanceof PixiMesh3D)) names.add(child.label);
    });
    for (const skeleton of this.model?.skeletons ?? []) {
      for (const label of Object.keys((skeleton as any)._labelToIndex ?? {})) names.add(label);
    }
    return [...names];
  }

  /** Re-applies `morphWeights` after the player, which a clip with a weights track would overwrite */
  #morphTick = () => this.#applyMorphWeights();
  #morphTickActive = false;
  /** Whether the model's materials carry the dissolve shader bit */
  #dissolveReady = false;

  /** Gives every material of the model the dissolve bit the first time, then writes the values. */
  #syncDissolve() {
    if (!this.model) return;
    const settings = normalizeDissolve(this.fullProps.dissolve);
    if (!settings && !this.#dissolveReady) return;
    if (settings && !this.#dissolveReady) {
      this.#dissolveReady = true;
      this.#applyMaterialOverrides();
    }
    for (const material of this.model.materials) applyDissolve(material, settings ?? { amount: 0 });
  }

  #syncMorphTick() {
    const wanted = !!this.fullProps.morphWeights && !!this.model;
    if (wanted && !this.#morphTickActive) Ticker.shared.add(this.#morphTick, undefined, UPDATE_PRIORITY.LOW);
    if (!wanted && this.#morphTickActive) Ticker.shared.remove(this.#morphTick);
    this.#morphTickActive = wanted;
  }

  #applyMorphWeights() {
    const weights = this.fullProps.morphWeights;
    if (!weights || !this.model) return;
    this.model.traverse((node: any) => {
      if (!(node instanceof PixiMesh3D) || !node.weights) return;
      const values = Array.isArray(weights) ? weights : weights[node.label ?? ""];
      if (!values) return;
      // Write into the array: replacing it disconnects it from the clips
      for (let i = 0; i < node.weights.length && i < values.length; i++) node.weights[i] = values[i];
    });
  }

  async #load(src: string | Scene3DSource) {
    const version = ++this.#loadVersion;
    const source = typeof src === "string" ? await Assets.load<Scene3DSource>(src) : src;
    if (version !== this.#loadVersion || this.destroyed) return;
    this.#disposeModel();
    if (typeof src === "string") {
      retainSource(src);
      this.#sourceUrl = src;
    }
    const { castShadow, receiveShadow } = this.fullProps;
    // The `animation` prop drives playback: no clip starts on its own
    this.model = new PixiModel3D({ source, castShadow, receiveShadow, autoPlay: false, scene: this.fullProps.scene });
    this.addChild(this.model);
    if (this.fullProps.blend) this.#syncBlend();
    else this.#play();
    if (this.fullProps.materials) this.#applyMaterialOverrides();
    if (this.fullProps.useCamera !== undefined) this.#syncCamera();
    this.#applyMorphWeights();
    this.#syncMorphTick();
    // Opt-in passes target meshes, which exist only now
    this.applyPassFlag("outline", this.fullProps.outlined);
    this.applyPassFlag("wireframe", this.fullProps.wireframe);
    for (const [node, bone] of this.#boneChildren) this.#placeOnBone(node, bone);
    this.#dissolveReady = false;
    if (this.fullProps.dissolve !== undefined) this.#syncDissolve();
    this.fullProps.onLoad?.(this.model);
    // A camera framing the scene re-frames once the model is in
    if (this.element) findViewComponent(this.element)?.notifySceneChange?.();
  }

  /** Switches to the clip named by `animation`, fading out the clip that was playing. */
  #play() {
    const player = this.model?.player;
    if (!player) return;
    const clip = this.fullProps.animation ?? null;
    if (clip === this.#clip) return;
    this.#clip = clip;
    this.#stopFade();

    const previous = this.#state;
    if (!clip) {
      player.stop();
      this.#state = null;
      return;
    }
    if (!player.getAnimation(clip)) {
      console.warn(`<Model3D> no animation named "${clip}"`);
      previous?.stop();
      this.#state = null;
      return;
    }
    const next = player.play(clip);
    // Callbacks read the props when they fire, so a new handler takes effect at once
    next.onComplete = () => this.fullProps.onAnimationEnd?.(clip);
    next.onLoop = () => this.fullProps.onAnimationLoop?.(clip);
    next.loop = this.fullProps.loop ?? true;
    next.animationSpeed = this.fullProps.animationSpeed ?? 1;
    this.#state = next;
    if (!previous || previous === next) {
      next.weight = 1;
      return;
    }

    const duration = this.fullProps.fadeDuration ?? 0.25;
    if (duration <= 0) {
      previous.stop();
      next.weight = 1;
      return;
    }
    const from = previous.weight;
    let elapsed = 0;
    next.weight = 0;
    this.#fade = (ticker: Ticker) => {
      elapsed += ticker.deltaMS / 1000;
      const t = Math.min(1, elapsed / duration);
      next.weight = t;
      previous.weight = from * (1 - t);
      if (t >= 1) {
        previous.stop();
        previous.weight = 1;
        this.#stopFade();
      }
    };
    // The player advances on Ticker.shared too
    Ticker.shared.add(this.#fade);
  }

  #stopFade() {
    if (this.#fade) Ticker.shared.remove(this.#fade);
    this.#fade = null;
  }

  #applyShadows() {
    const { castShadow, receiveShadow } = this.fullProps;
    this.model?.traverse((node: any) => {
      if (castShadow !== undefined && "castShadow" in node) node.castShadow = castShadow;
      if (receiveShadow !== undefined && "receiveShadow" in node) node.receiveShadow = receiveShadow;
    });
  }

  /**
   * Gives this model its own materials: the `materials` changes, then the dissolve bit.
   * Copies, so other models from the same file keep theirs.
   */
  #applyMaterialOverrides() {
    const model = this.model;
    if (!model) return;
    const overrides = this.fullProps.materials;
    const dissolve = this.#dissolveReady;
    if (!overrides && !dissolve) {
      model.materials = undefined;
      return;
    }
    model.materials = (source: BaseMaterial3D) => {
      let material = source;
      if (typeof overrides === "function") {
        material = overrides(material);
      } else if (overrides) {
        const change = overrides[(source as any).label ?? ""];
        if (change instanceof BaseMaterial3D) material = change;
        else if (change) material = (material as any).clone(change);
      }
      return dissolve ? withDissolveBit(material) : material;
    };
    if (dissolve) {
      const settings = normalizeDissolve(this.fullProps.dissolve) ?? { amount: 0 };
      for (const material of model.materials) applyDissolve(material, settings);
    }
  }

  /** Plays every clip of `blend` at its weight, and stops the clips left out. */
  #syncBlend() {
    const player = this.model?.player;
    if (!player) return;
    const layers = (this.fullProps.blend as BlendLayer[] | undefined) ?? [];
    this.#stopFade();
    if (!layers.length) {
      // Back to the single `animation` clip
      player.stop();
      this.#blendClips.clear();
      this.#state = null;
      this.#clip = null;
      this.#play();
      return;
    }
    this.#clip = null;
    this.#state = null;
    const wanted = new Set<string>();
    for (const layer of layers) {
      if (!player.getAnimation(layer.clip)) {
        console.warn(`<Model3D> no animation named "${layer.clip}"`);
        continue;
      }
      wanted.add(layer.clip);
      const state = player.getState(layer.clip);
      if (!this.#blendClips.has(layer.clip)) {
        state.onComplete = () => this.fullProps.onAnimationEnd?.(layer.clip);
        state.onLoop = () => this.fullProps.onAnimationLoop?.(layer.clip);
        state.gotoAndPlay(0);
      }
      state.weight = layer.weight ?? 1;
      state.animationSpeed = layer.speed ?? 1;
      state.loop = layer.loop ?? true;
    }
    for (const clip of this.#blendClips) {
      if (!wanted.has(clip)) player.getState(clip).stop();
    }
    this.#blendClips = wanted;
  }

  #blendClips = new Set<string>();
  /** The view's own camera while a file camera is in use */
  #savedCamera: any = null;

  /** Looks through a camera of the file, or gives the view its own camera back. */
  #syncCamera() {
    const view = this.element ? findViewComponent(this.element)?.view : null;
    if (!view) return;
    const choice = this.fullProps.useCamera;
    const cameras = this.model?.cameras ?? [];
    let camera: any = null;
    if (choice === true) camera = cameras[0];
    else if (typeof choice === "number") camera = cameras[choice];
    else if (typeof choice === "string") camera = cameras.find((c: any) => c.label === choice);
    if (choice !== undefined && choice !== false && !camera) {
      console.warn(`<Model3D> no camera "${String(choice)}" in the file. Cameras: ${cameras.map((c: any) => c.label).join(", ") || "none"}`);
    }
    if (camera) {
      if (!this.#savedCamera) this.#savedCamera = view.camera;
      view.camera = camera;
    } else if (this.#savedCamera) {
      view.camera = this.#savedCamera;
      this.#savedCamera = null;
    }
  }

  #disposeModel() {
    this.#stopFade();
    if (this.#morphTickActive) Ticker.shared.remove(this.#morphTick);
    this.#morphTickActive = false;
    this.#state = null;
    this.#clip = null;
    this.#blendClips.clear();
    if (this.#savedCamera) {
      const view = this.element ? findViewComponent(this.element)?.view : null;
      if (view) view.camera = this.#savedCamera;
      this.#savedCamera = null;
    }
    if (this.model) {
      // Bone children belong to their own components: take them out before destroying
      for (const node of this.#boneChildren.keys()) {
        if (node.parent && node.parent !== (this as unknown as Container3D)) this.addChild(node);
      }
      // The sockets go with the model's bones and followers; new ones are made for the next model
      this.#sockets.clear();
      for (const node of [...this.#followers.keys()]) this.#removeFollower(node);
      this.removeChild(this.model);
      this.model.destroy();
      this.model = null;
    }
    if (this.#sourceUrl) {
      if (this.fullProps.unload !== false) releaseSource(this.#sourceUrl);
      else sourceUsers.set(this.#sourceUrl, Math.max(0, (sourceUsers.get(this.#sourceUrl) ?? 1) - 1));
      this.#sourceUrl = null;
    }
  }

  onDestroy(parent: any, afterDestroy?: () => void) {
    this.#loadVersion++;
    this.#disposeModel();
    super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("Model3D", CanvasModel3D);

/**
 * A glTF model.
 *
 * @example
 * ```html
 * <Model3D src="./models/hero.glb" position={heroPos} animation={clip} fadeDuration={0.3} castShadow={true} />
 * ```
 */
export const Model3D: ComponentFunction<Model3DProps> = (props) => createComponent("Model3D", props);

export { CanvasModel3D };
