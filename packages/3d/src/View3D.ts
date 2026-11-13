import { Container } from "pixi.js";
import { createComponent, DisplayObject, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { View3D as PixiView3D, type View3DOptions } from "@pixi/3d";
import { deepMerge } from "./utils";

/** Props of `<View3D>`. Every 2D display-object prop (x, y, alpha, filters, ...) works too. */
export interface View3DProps {
  /** Width in pixels. Leave width and height out to fill the screen. */
  width?: number | string;
  height?: number | string;
  /** Soft fill light: a hemisphere `{ skyColor, groundColor, intensity }` or a CubeTexture */
  environment?: View3DOptions["environment"];
  /** Clear colour, hemisphere or CubeTexture drawn behind the scene */
  background?: View3DOptions["background"];
  toneMapping?: View3DOptions["toneMapping"];
  exposure?: number;
  fog?: View3DOptions["fog"];
  /** Shadow map size. Changing it rebuilds the view. */
  shadowQuality?: View3DOptions["shadowQuality"];
  cull?: View3DOptions["cull"];
  /** Post-processing passes (BloomEffect, FxaaEffect... from `@pixi/3d/extras`) */
  passes?: View3DOptions["passes"];
  [key: string]: any;
}

/** Props passed to the `@pixi/3d` View3D constructor; the others are set live. */
const CONSTRUCTOR_ONLY = ["shadowQuality"] as const;

/**
 * 2D display object that renders a 3D scene. Its children (Mesh3D, lights, Camera3D...)
 * are placed in the scene, under `view.root`.
 */
class CanvasView3D extends DisplayObject(Container) {
  view: PixiView3D;
  #settings: View3DProps = {};

  get childTarget3D() {
    return this.view?.root;
  }

  onInit(props: View3DProps) {
    super.onInit(props);
    this.#settings = { ...props };
    this.#createView();
  }

  #createView() {
    const previous = this.view;
    const s = this.#settings;
    const options: View3DOptions = {};
    for (const key of CONSTRUCTOR_ONLY) {
      if (s[key] !== undefined) (options as any)[key] = s[key];
    }
    this.view = new PixiView3D(options);
    this.#applySize();
    this.#applyLive(s);
    if (previous) {
      // Move the scene and camera to the new view
      const children = [...previous.root.children].filter((c) => c !== previous.camera);
      for (const child of children) this.view.root.addChild(child);
      this.view.camera.position.copyFrom(previous.camera.position);
      this.view.camera.quaternion.copyFrom(previous.camera.quaternion);
      this.view.camera.fov = previous.camera.fov;
      this.removeChild(previous);
      previous.destroy();
    }
    this.addChildAt(this.view, 0);
  }

  #applyLive(props: View3DProps) {
    const view = this.view as any;
    const s = this.#settings;
    if ("environment" in props) view.environment = s.environment ?? null;
    if ("background" in props) view.background = s.background ?? null;
    if (props.toneMapping !== undefined) view.toneMapping = props.toneMapping;
    if (props.exposure !== undefined) view.exposure = props.exposure;
    if ("fog" in props) view.fog = s.fog ?? null;
    if (props.cull !== undefined) view.cull = props.cull;
    if ("passes" in props) view.passes = props.passes ?? null;
  }

  #applySize() {
    const { width, height } = this.#settings;
    const fixed = typeof width === "number" && typeof height === "number";
    this.view.autoResize = !fixed;
    if (typeof width === "number") this.view.width = width;
    if (typeof height === "number") this.view.height = height;
  }

  onUpdate(props: View3DProps) {
    // Sizes go to the inner view: resizing a 2D container would scale the scene
    const { width, height, ...rest } = props;
    super.onUpdate(rest);
    const previous = this.#settings;
    this.#settings = deepMerge(this.#settings, props);
    if (!this.view) return;

    if (CONSTRUCTOR_ONLY.some((key) => key in props && props[key] !== previous[key])) {
      this.#createView();
      return;
    }
    if (width !== undefined || height !== undefined) this.#applySize();
    this.#applyLive(props);
  }

  async onDestroy(parent: Element, afterDestroy: () => void) {
    await super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("View3D", CanvasView3D);

/**
 * Renders a 3D scene inside the 2D canvas.
 *
 * @example
 * ```html
 * <View3D toneMapping="aces" environment={{ skyColor: 0xbcd4f0, groundColor: 0x6b6250, intensity: 0.7 }}>
 *   <Camera3D position={[0, 5, 10]} lookAt={[0, 0, 0]} orbit />
 *   <DirectionalLight intensity={3} rotation={[-0.8, 0.5, 0]} castShadow />
 *   <Mesh3D geometry={{ type: "cube" }} material={{ baseColor: 0xd9534f }} />
 * </View3D>
 * ```
 */
export const View3D: ComponentFunction<View3DProps> = (props) => createComponent("View3D", props);

export { CanvasView3D };
