import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import type { Camera3D as PixiCamera3D } from "@pixi/3d";
import { OrbitCamera, type OrbitCameraOptions } from "@pixi/3d/extras";
import { findParent3D, type Node3DProps } from "./Node3D";
import { deepMerge, mergeVec3 } from "./utils";

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
}

/**
 * Configures the camera owned by the parent `<View3D>`; it creates no camera.
 * It is a placeholder in the component tree and drives `view.camera`.
 */
class CanvasCamera3D {
  fullProps: Camera3DProps = {};
  camera: PixiCamera3D | null = null;
  orbit: OrbitCamera | null = null;
  #view: any = null;

  onInit(props: Camera3DProps) {
    this.fullProps = { ...props };
  }

  onMount(element: Element<any>) {
    const root = findParent3D(element);
    // The camera lives on the view: reach it from the scene root
    let view: any = null;
    let parent = element.parent;
    while (parent && !view) {
      view = (parent.componentInstance as any)?.view ?? null;
      parent = parent.parent;
    }
    if (!root || !view) {
      console.warn("<Camera3D> must be placed inside a <View3D>");
      return;
    }
    this.#view = view;
    this.camera = view.camera;
    this.#apply(this.fullProps, true);
  }

  onUpdate(props: Camera3DProps) {
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

    if (initial || "orbit" in props) this.#syncOrbit(lookAt);
  }

  #syncOrbit(lookAt?: { x: number; y: number; z: number }) {
    const orbit = this.fullProps.orbit;
    this.orbit?.destroy();
    this.orbit = null;
    if (!orbit) return;
    const options = orbit === true ? {} : orbit;
    this.orbit = new OrbitCamera({ target: lookAt, ...options, view: this.#view });
  }

  onDestroy(_parent: Element<any>, afterDestroy?: () => void) {
    this.orbit?.destroy();
    this.orbit = null;
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
 * ```
 */
export const Camera3D: ComponentFunction<Camera3DProps> = (props) => createComponent("Camera3D", props);

export { CanvasCamera3D };
