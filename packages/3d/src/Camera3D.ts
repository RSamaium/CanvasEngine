import { Ticker } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import type { Camera3D as PixiCamera3D } from "@pixi/3d";
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
   * Mouse orbit controls. `true` for defaults, or OrbitCamera options
   * (`target`, `enableDamping`, `minDistance`, `autoRotate`...).
   */
  orbit?: boolean | Omit<OrbitCameraOptions, "view">;
  /**
   * First-person controls: mouse look (pointer lock on click) and WASD / arrow keys.
   * `true` for defaults, or FPSCamera options (`moveSpeed`, `lookSpeed`, `height`...).
   */
  fps?: boolean | FpsOptions;
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

  onInit(props: Camera3DProps) {
    this.fullProps = resolveObjectChanges({ ...props }, {});
  }

  onMount(element: Element<any>) {
    const view = findViewComponent(element)?.view;
    if (!view) {
      console.warn("<Camera3D> must be placed inside a <View3D>");
      return;
    }
    this.#view = view;
    this.camera = view.camera;
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

    const position = mergeVec3(camera.position, props.position);
    if (position) camera.position.set(position.x, position.y, position.z);
    const lookAt = mergeVec3({ x: 0, y: 0, z: 0 }, this.fullProps.lookAt);
    if (lookAt && (initial || position || props.lookAt !== undefined)) camera.lookAt(lookAt);

    if (initial || "orbit" in props || "fps" in props) this.#syncController(lookAt);
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
      this.controller = new OrbitCamera({ target: lookAt, ...options, view: this.#view });
    }
  }

  #stopController() {
    if (this.#tick) Ticker.shared.remove(this.#tick);
    this.#tick = null;
    this.controller?.destroy();
    this.controller = null;
  }

  onDestroy(_parent: Element<any>, afterDestroy?: () => void) {
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
