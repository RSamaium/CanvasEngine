import { Ticker } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { Sphere, type Camera3D as PixiCamera3D, type Container3D } from "@pixi/3d";
import { FPSCamera, OrbitCamera, type FPSCameraOptions, type OrbitCameraOptions } from "@pixi/3d/extras";
import { findViewComponent, type Node3DProps } from "./Node3D";
import { deepMerge, mergeVec3, resolveObjectChanges } from "./utils";

export interface FpsOptions extends Omit<FPSCameraOptions, "view" | "position"> {
  /** Keeps the camera at this height, for a walker on flat ground */
  height?: number;
}

export interface Camera3DProps extends Node3DProps {
  /** Vertical field of view in degrees (default 60) */
  fov?: number;
  near?: number;
  far?: number;
  mode?: "perspective" | "orthographic";
  /** Half the view's width in world units, in orthographic mode */
  orthographicSize?: number;
  /**
   * Part of the view the camera draws in, `[x, y, width, height]` from 0 to 1:
   * `[0, 0, 0.5, 1]` is the left half, for split screen. Default the whole view.
   */
  viewport?: [number, number, number, number];
  /**
   * Mouse orbit controls. `true` for defaults, or OrbitCamera options
   * (`target`, `enableDamping`, `minDistance`, `autoRotate`...).
   */
  orbit?: boolean | Omit<OrbitCameraOptions, "view">;
  /**
   * First-person controls: mouse look (pointer lock on click) and WASD / arrow keys.
   * `true` for defaults, or FPSCamera options (`moveSpeed`, `lookSpeed`, `height`...).
   */
  fps?: boolean | FpsOptions;
  /**
   * Places the camera so the whole target is in view, and again when a model loads.
   * `true` frames the scene, a string frames the node with that `label`, or options.
   */
  frame?: boolean | string | FrameOptions;
}

export interface FrameOptions {
  /** `label` of the node to frame. Default: the whole scene */
  target?: string;
  /** Angle above the horizon, in degrees. Default 30 */
  pitch?: number;
  /** Angle around the vertical axis, in degrees, 0 looking from +Z. Default 0 */
  yaw?: number;
  /** Extra room around the target: 1 fits it exactly. Default 1.1 */
  padding?: number;
}

type Controller = { destroy(): void };

/**
 * Configures the camera owned by the parent `<View3D>`; it creates no camera.
 * It is a placeholder in the component tree and drives `view.camera`.
 */
class CanvasCamera3D {
  fullProps: Camera3DProps = {};
  camera: PixiCamera3D | null = null;
  /** The active OrbitCamera or FPSCamera, if any */
  controller: Controller | null = null;
  #view: any = null;
  #tick: ((ticker: Ticker) => void) | null = null;
  #stopSceneListener: (() => void) | null = null;
  /** Orbit target and limits found by the last framing */
  #framedOrbit: { target: { x: number; y: number; z: number }; minDistance: number; maxDistance: number } | null = null;

  onInit(props: Camera3DProps) {
    this.fullProps = resolveObjectChanges({ ...props }, {});
  }

  onMount(element: Element<any>) {
    const viewComponent = findViewComponent(element);
    const view = viewComponent?.view;
    if (!view) {
      console.warn("<Camera3D> must be placed inside a <View3D>");
      return;
    }
    this.#view = view;
    this.camera = view.camera;
    this.#stopSceneListener = viewComponent.onSceneChange?.(() => {
      if (this.fullProps.frame) this.#frame();
    }) ?? null;
    this.#apply(this.fullProps, true);
  }

  onUpdate(props: Camera3DProps) {
    props = resolveObjectChanges(props, this.fullProps);
    this.fullProps = deepMerge(this.fullProps, props);
    if (this.camera) this.#apply(props, false);
  }

  #apply(props: Camera3DProps, initial: boolean) {
    const camera = this.camera!;
    if (props.fov !== undefined) camera.fov = props.fov;
    if (props.near !== undefined) camera.near = props.near;
    if (props.far !== undefined) camera.far = props.far;
    if (props.mode !== undefined) camera.mode = props.mode;
    if (props.orthographicSize !== undefined) camera.orthographicSize = props.orthographicSize;
    if (props.viewport !== undefined) {
      const [x, y, width, height] = props.viewport ?? [0, 0, 1, 1];
      camera.viewport.set(x, y, width, height);
    }

    const position = mergeVec3(camera.position, props.position);
    if (position) camera.position.set(position.x, position.y, position.z);
    const lookAt = mergeVec3({ x: 0, y: 0, z: 0 }, this.fullProps.lookAt);
    if (lookAt && (initial || position || props.lookAt !== undefined)) camera.lookAt(lookAt);

    if (initial || "orbit" in props || "fps" in props) this.#syncController(lookAt);
    if ("frame" in props && !this.fullProps.frame) this.#framedOrbit = null;
    if ((initial || "frame" in props) && this.fullProps.frame) this.#frame();
  }

  /** Moves the camera back from the target until its bounding sphere fits the view. */
  #frame(): boolean {
    const view = this.#view;
    const camera = this.camera;
    if (!view || !camera) return false;
    const value = this.fullProps.frame;
    const options: FrameOptions = typeof value === "string" ? { target: value } : value === true || !value ? {} : value;
    const node: Container3D | null = options.target ? view.root.getChildByLabel(options.target, true) : view.root;
    if (!node) return false;
    const box = node.getLocalBounds();
    if (!box || !(box.max.x >= box.min.x)) return false;
    const sphere = new Sphere().setFromBox(box).applyMatrix4(node.getGlobalTransform());
    const { center, radius } = sphere;
    if (!(radius > 0)) return false;

    // Half the narrower field of view: horizontal on a portrait view, vertical otherwise
    const aspect = view.width > 0 && view.height > 0 ? view.width / view.height : 1;
    const halfFov = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * Math.min(1, aspect));
    const distance = (radius * (options.padding ?? 1.1)) / Math.sin(halfFov);
    const pitch = ((options.pitch ?? 30) * Math.PI) / 180;
    const yaw = ((options.yaw ?? 0) * Math.PI) / 180;
    camera.position.set(
      center.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      center.y + Math.sin(pitch) * distance,
      center.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    camera.lookAt(center);
    // Models come in any size: near and far follow the distance
    camera.near = distance / 100;
    camera.far = distance * 100;

    this.#framedOrbit = { target: { x: center.x, y: center.y, z: center.z }, minDistance: radius, maxDistance: distance * 5 };
    // An orbit controller keeps its own state: rebuild it around the new target
    if (this.fullProps.orbit && !this.fullProps.fps) this.#syncController(this.#framedOrbit.target);
    return true;
  }

  #syncController(lookAt?: { x: number; y: number; z: number }) {
    this.#stopController();
    const { orbit, fps } = this.fullProps;
    if (fps) {
      const { height, ...options } = fps === true ? ({} as FpsOptions) : fps;
      const p = this.camera!.position;
      const controller = new FPSCamera({
        ...options,
        view: this.#view,
        position: { x: p.x, y: p.y, z: p.z },
        autoUpdate: height === undefined,
      });
      if (height !== undefined) {
        // Walking follows the pitch: pin the height after each step
        this.#tick = (ticker) => {
          controller.update(ticker);
          controller.camera.position.y = height;
        };
        Ticker.shared.add(this.#tick);
      }
      this.controller = controller;
      return;
    }
    if (orbit) {
      const options = orbit === true ? {} : orbit;
      const framed = this.#framedOrbit;
      this.controller = new OrbitCamera({
        // A framed target wins over lookAt; the user's own limits win over the framed ones
        target: framed?.target ?? lookAt,
        ...(framed ? { minDistance: framed.minDistance, maxDistance: framed.maxDistance } : {}),
        ...options,
        ...(framed ? { target: framed.target } : {}),
        view: this.#view,
      });
    }
  }

  #stopController() {
    if (this.#tick) Ticker.shared.remove(this.#tick);
    this.#tick = null;
    this.controller?.destroy();
    this.controller = null;
  }

  onDestroy(_parent: Element<any>, afterDestroy?: () => void) {
    this.#stopSceneListener?.();
    this.#stopSceneListener = null;
    this.#stopController();
    this.camera = null;
    this.#view = null;
    afterDestroy?.();
  }
}

registerComponent("Camera3D", CanvasCamera3D);

/**
 * Sets up the camera of the parent `<View3D>`.
 *
 * @example
 * ```html
 * <Camera3D position={[0, 5, 12]} lookAt={[0, 1, 0]} fov={50} orbit={{ enableDamping: true }} />
 * <Camera3D position={[0, 1.7, 8]} fps={{ height: 1.7, moveSpeed: 4 }} />
 * ```
 */
export const Camera3D: ComponentFunction<Camera3DProps> = (props) => createComponent("Camera3D", props);

export { CanvasCamera3D };
