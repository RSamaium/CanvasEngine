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
import { Node3D, type Node3DProps } from "./Node3D";

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
    if (props.src !== undefined) this.#load(props.src);
    else if (this.model) {
      if (props.animation !== undefined) this.#play();
      if (this.#state && props.loop !== undefined) this.#state.loop = props.loop;
      if (this.#state && props.animationSpeed !== undefined) this.#state.animationSpeed = props.animationSpeed;
      if (props.castShadow !== undefined || props.receiveShadow !== undefined) this.#applyShadows();
      if (props.morphWeights !== undefined) {
        this.#applyMorphWeights();
        this.#syncMorphTick();
      }
    }
  }

  /**
   * Makes `node` follow the bone named `bone`. The node's own position, rotation and
   * scale are an offset from the bone, in the model's units and axes. Works with bones
   * that are scene nodes.
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
  }

  /** Bone sockets: nodes that cancel a bone's rest rotation and scale, one per attached node */
  #sockets = new Map<Container3D, Container3D>();

  #placeOnBone(node: Container3D, bone: string) {
    const target = this.model?.getChildByLabel(bone, true) as Container3D | null;
    if (!target) {
      const labels: string[] = [];
      this.model?.traverse((child: any) => {
        if (child.label && !(child instanceof PixiMesh3D)) labels.push(child.label);
      });
      console.warn(`<Model3D> no bone node named "${bone}". Available: ${labels.join(", ")}`);
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

  /** Re-applies `morphWeights` after the player, which a clip with a weights track would overwrite */
  #morphTick = () => this.#applyMorphWeights();
  #morphTickActive = false;

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
    this.model = new PixiModel3D({ source, castShadow, receiveShadow, autoPlay: false });
    this.addChild(this.model);
    this.#play();
    this.#applyMorphWeights();
    this.#syncMorphTick();
    // Opt-in passes target meshes, which exist only now
    this.applyPassFlag("outline", this.fullProps.outlined);
    this.applyPassFlag("wireframe", this.fullProps.wireframe);
    for (const [node, bone] of this.#boneChildren) this.#placeOnBone(node, bone);
    this.fullProps.onLoad?.(this.model);
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

  #disposeModel() {
    this.#stopFade();
    if (this.#morphTickActive) Ticker.shared.remove(this.#morphTick);
    this.#morphTickActive = false;
    this.#state = null;
    this.#clip = null;
    if (this.model) {
      // Bone children belong to their own components: take them out before destroying
      for (const node of this.#boneChildren.keys()) {
        if (node.parent && node.parent !== (this as unknown as Container3D)) this.addChild(node);
      }
      // The sockets go with the model's bones; new ones are made for the next model
      this.#sockets.clear();
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
