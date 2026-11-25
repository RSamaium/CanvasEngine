import { RenderTexture, type Texture } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import {
  BackgroundPass,
  Camera3D as PixiCamera3D,
  FlatMaterial,
  Mesh3D as PixiMesh3D,
  MeshPass,
  Pass3D,
  PlaneGeometry,
  type PassContext,
  type RenderGraph,
} from "@pixi/3d";
import { findViewComponent, Node3D, type Node3DProps } from "./Node3D";
import { mergeVec3, type Vec3Input } from "./utils";

export interface MonitorCamera {
  position?: Vec3Input;
  lookAt?: Vec3Input;
  rotation?: Vec3Input;
  /** Vertical field of view in degrees */
  fov?: number;
  near?: number;
  far?: number;
  mode?: "perspective" | "orthographic";
  orthographicSize?: number;
}

export interface Monitor3DProps extends Node3DProps {
  /** Where the second camera stands and looks */
  camera?: MonitorCamera;
  /** Size of the picture in pixels, `[width, height]`. Default `[512, 288]` */
  resolution?: [number, number];
  /** Screen width in world units; the height follows the picture's shape. Default 4 */
  width?: number;
  /** Draws the view's background in the picture where no mesh is. Default `true` */
  background?: boolean;
  /** Draws the picture. Set `false` to pause the camera; the screen keeps its last picture. */
  active?: boolean;
  /** Shows the screen mesh. Set `false` to only use the texture, e.g. in a 2D minimap. */
  showScreen?: boolean;
  /** Called with the picture's texture, to show it elsewhere (a 2D Sprite shows it the right way up) */
  onTexture?: (texture: Texture) => void;
}

/** Draws the view's background for a second camera, before its meshes. */
class SkyPass extends Pass3D {
  readonly stage = "beforeOpaque" as const;
  constructor(private readonly camera: PixiCamera3D) {
    super();
  }
  build(graph: RenderGraph, { renderer }: PassContext) {
    graph.addPass(new BackgroundPass({ renderer: renderer as any, camera: this.camera }));
  }
}

/**
 * A screen showing the scene from a second camera: a security monitor, a mirror-like
 * view, or (with `showScreen={false}` and `onTexture`) a minimap.
 */
class CanvasMonitor3D extends Node3D(PixiMesh3D) {
  secondCamera: PixiCamera3D | null = null;
  renderTexture: RenderTexture | null = null;
  #passes: Pass3D[] = [];
  #viewComponent: any = null;

  applyProps3D(props: Monitor3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (initial || "resolution" in props || "width" in props) this.#build();
    else if ("background" in props) this.#registerPasses();
    if (props.camera !== undefined) this.#applyCamera(props.camera, initial);
    if (props.active !== undefined) for (const pass of this.#passes) pass.enabled = props.active;
    if (props.showScreen !== undefined) this.#applyScreen();
  }

  #build() {
    const view = this.element ? findViewComponent(this.element) : null;
    if (!view) return;
    this.#viewComponent = view;
    const [width, height] = (this.fullProps.resolution as [number, number]) ?? [512, 288];
    const previousTexture = this.renderTexture;
    this.renderTexture = RenderTexture.create({ width, height, antialias: true, autoGenerateMipmaps: true });

    if (!this.secondCamera) {
      this.secondCamera = new PixiCamera3D({ renderTexture: this.renderTexture });
      // A second camera must be in the scene for the view to place it
      view.view.root.addChild(this.secondCamera);
    } else {
      this.secondCamera.renderTexture = this.renderTexture;
    }
    this.#applyCamera(this.fullProps.camera ?? {}, true);

    const screenWidth = this.fullProps.width ?? 4;
    this.geometry?.destroy();
    this.geometry = new PlaneGeometry({ width: screenWidth, height: (screenWidth * height) / width, flipV: true });
    const previousMaterial = this.material;
    this.material = new FlatMaterial({ baseColorTexture: this.renderTexture });
    previousMaterial?.destroy();
    this.#applyScreen();
    this.#registerPasses();
    previousTexture?.destroy(true);
    this.fullProps.onTexture?.(this.renderTexture);
  }

  #registerPasses() {
    if (!this.#viewComponent || !this.secondCamera) return;
    const camera = this.secondCamera;
    this.#passes = [
      ...(this.fullProps.background === false ? [] : [new SkyPass(camera)]),
      new MeshPass({ name: "opaque", camera }),
      new MeshPass({ name: "transparent", camera, sort: "distance" }),
    ];
    if (this.fullProps.active === false) for (const pass of this.#passes) pass.enabled = false;
    this.#viewComponent.registerPasses(this, this.#passes, "camera");
  }

  #applyCamera(settings: MonitorCamera, initial: boolean) {
    const camera = this.secondCamera;
    if (!camera) return;
    for (const key of ["fov", "near", "far", "mode", "orthographicSize"] as const) {
      if (settings[key] !== undefined) (camera as any)[key] = settings[key];
    }
    const merged: MonitorCamera = this.fullProps.camera ?? {};
    const position = mergeVec3(camera.position, settings.position);
    if (position) camera.position.set(position.x, position.y, position.z);
    const rotation = mergeVec3(camera.rotation, settings.rotation);
    if (rotation) camera.rotation.set(rotation.x, rotation.y, rotation.z);
    const lookAt = mergeVec3({ x: 0, y: 0, z: 0 }, merged.lookAt);
    if (lookAt && (initial || position || settings.lookAt !== undefined)) camera.lookAt(lookAt);
  }

  #applyScreen() {
    // Hidden by its pass flags only, so the second camera keeps drawing
    if (this.fullProps.showScreen === false) this.disablePass("opaque");
    else this.enablePass("opaque");
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    this.#viewComponent?.unregisterPasses(this);
    this.#viewComponent = null;
    const camera = this.secondCamera;
    const texture = this.renderTexture;
    const material = this.material;
    const geometry = this.geometry;
    this.secondCamera = null;
    this.renderTexture = null;
    super.onDestroy(parent, afterDestroy);
    camera?.parent?.removeChild(camera);
    camera?.destroy();
    geometry?.destroy();
    material?.destroy();
    texture?.destroy(true);
  }
}

registerComponent("Monitor3D", CanvasMonitor3D);

/**
 * A screen showing the scene from a second camera.
 *
 * @example
 * ```html
 * <Monitor3D
 *   position={[0, 2.5, -6]}
 *   width={4}
 *   camera={{ position: [-3, 6, -10], lookAt: [0, 0, 0], fov: 50 }}
 * />
 * ```
 */
export const Monitor3D: ComponentFunction<Monitor3DProps> = (props) => createComponent("Monitor3D", props);

export { CanvasMonitor3D };
