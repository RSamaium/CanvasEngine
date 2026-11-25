import { Assets, Container, type Renderer } from "pixi.js";
import { createComponent, DisplayObject, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { View3D as PixiView3D, type Pass3D, type View3DOptions } from "@pixi/3d";
import { GraphDebugOverlay } from "@pixi/3d/extras";
import { deepMerge, resolveObjectChanges } from "./utils";

type EnvironmentInput = View3DOptions["environment"] | string;
type BackgroundInput = View3DOptions["background"] | string;

/** Props of `<View3D>`. Every 2D display-object prop (x, y, alpha, filters, ...) works too. */
export interface View3DProps {
  /** Width in pixels. Leave width and height out to fill the screen. */
  width?: number | string;
  height?: number | string;
  /**
   * Soft fill light: a hemisphere `{ skyColor, groundColor, intensity }`, a CubeTexture,
   * or the URL of a `.hdr` / `.cubemap` file
   */
  environment?: EnvironmentInput;
  /** Drawn behind the scene: a colour, a hemisphere, a CubeTexture or a `.hdr` / `.cubemap` URL */
  background?: BackgroundInput;
  toneMapping?: View3DOptions["toneMapping"];
  exposure?: number;
  fog?: View3DOptions["fog"];
  /** Shadow map size. Changing it rebuilds the view. */
  shadowQuality?: View3DOptions["shadowQuality"];
  cull?: View3DOptions["cull"];
  /** Render resolution, or `"inherit"` (default). Changing it rebuilds the view. */
  resolution?: View3DOptions["resolution"];
  /** Extra passes, drawn after second cameras and before the effect components */
  passes?: readonly Pass3D[];
  /** Shows the render graph debug panel */
  debug?: boolean;
  [key: string]: any;
}

/** Props passed to the `@pixi/3d` View3D constructor; the others are set live. */
const CONSTRUCTOR_ONLY = ["shadowQuality", "resolution"] as const;

/** Where a group of passes sits in the view's list. */
export type PassGroup = "camera" | "effect";

/**
 * 2D display object that renders a 3D scene. Its 3D children (Mesh3D, lights,
 * Camera3D...) are placed in the scene, under `view.root`; its 2D children are
 * drawn over it.
 */
class CanvasView3D extends DisplayObject(Container) {
  readonly isView3DComponent = true;
  view: PixiView3D;
  #settings: View3DProps = {};
  #registeredPasses = new Map<object, { group: PassGroup; passes: Pass3D[] }>();
  #assetVersion = { environment: 0, background: 0 };
  #debugOverlay: GraphDebugOverlay | null = null;
  #element: Element<any> | null = null;

  get childTarget3D() {
    return this.view?.root;
  }

  /** The application renderer, once the canvas is ready. */
  get renderer(): Renderer | null {
    const app = this.#element?.props?.context?.app?.();
    return app?.renderer ?? null;
  }

  onInit(props: View3DProps) {
    super.onInit(props);
    this.#settings = resolveObjectChanges({ ...props }, {});
    this.#createView();
  }

  async onMount(element: Element<any>, index?: number) {
    this.#element = element;
    await super.onMount(element, index);
    this.#syncDebug();
  }

  /**
   * Adds passes owned by a child component (an effect, a second camera). Camera passes
   * come first, then the `passes` prop, then effects, each group in mount order.
   */
  registerPasses(owner: object, passes: Pass3D[], group: PassGroup) {
    this.#registeredPasses.set(owner, { group, passes });
    this.#syncPasses();
  }

  unregisterPasses(owner: object) {
    if (this.#registeredPasses.delete(owner)) this.#syncPasses();
  }

  #sceneListeners = new Set<() => void>();

  /** Calls `listener` when content that changes the scene's size arrives (a model loads). */
  onSceneChange(listener: () => void): () => void {
    this.#sceneListeners.add(listener);
    return () => this.#sceneListeners.delete(listener);
  }

  notifySceneChange() {
    for (const listener of this.#sceneListeners) listener();
  }

  #syncPasses() {
    if (!this.view) return;
    const byGroup = (group: PassGroup) =>
      [...this.#registeredPasses.values()].filter((entry) => entry.group === group).flatMap((entry) => entry.passes);
    this.view.passes = [...byGroup("camera"), ...(this.#settings.passes ?? []), ...byGroup("effect")];
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
      // Move the scene and camera settings to the new view
      const children = [...previous.root.children].filter((c) => c !== previous.camera);
      for (const child of children) this.view.root.addChild(child);
      this.view.camera.position.copyFrom(previous.camera.position);
      this.view.camera.quaternion.copyFrom(previous.camera.quaternion);
      this.view.camera.fov = previous.camera.fov;
      previous.passes = [];
      this.removeChild(previous);
      previous.destroy();
      this.#syncDebug(true);
    }
    this.#syncPasses();
    this.addChildAt(this.view, 0);
  }

  #applyLive(props: View3DProps) {
    const view = this.view as any;
    const s = this.#settings;
    if ("environment" in props) this.#applyAsset("environment", s.environment);
    if ("background" in props) this.#applyAsset("background", s.background);
    if (props.toneMapping !== undefined) view.toneMapping = props.toneMapping;
    if (props.exposure !== undefined) view.exposure = props.exposure;
    if ("fog" in props) view.fog = s.fog ?? null;
    if (props.cull !== undefined) view.cull = props.cull;
    if ("passes" in props) this.#syncPasses();
    if ("debug" in props) this.#syncDebug();
  }

  /** Sets `environment` or `background`, loading a `.hdr` / `.cubemap` URL first. */
  #applyAsset(key: "environment" | "background", value: EnvironmentInput | BackgroundInput) {
    const version = ++this.#assetVersion[key];
    if (typeof value !== "string" || !/\.(hdr|cubemap)(\?|$)/i.test(value)) {
      (this.view as any)[key] = value ?? null;
      return;
    }
    Assets.load(value)
      .then((texture) => {
        if (version === this.#assetVersion[key] && !this.destroyed) (this.view as any)[key] = texture;
      })
      .catch((error) => console.warn(`<View3D> ${key}:`, error));
  }

  #syncDebug(force = false) {
    const wanted = !!this.#settings.debug;
    if (force || !wanted) {
      this.#debugOverlay?.destroy();
      this.#debugOverlay = null;
    }
    if (wanted && !this.#debugOverlay && this.view) {
      const renderer = this.renderer;
      if (!renderer) return;
      this.#debugOverlay = new GraphDebugOverlay({ view: this.view as any, renderer });
    }
  }

  #applySize() {
    const { width, height } = this.#settings;
    const fixed = typeof width === "number" && typeof height === "number";
    this.view.autoResize = !fixed;
    if (typeof width === "number") this.view.width = width;
    if (typeof height === "number") this.view.height = height;
  }

  onUpdate(props: View3DProps) {
    props = resolveObjectChanges(props, this.#settings);
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
    this.#debugOverlay?.destroy();
    this.#debugOverlay = null;
    this.#registeredPasses.clear();
    this.#sceneListeners.clear();
    const view = this.view;
    await super.onDestroy(parent, afterDestroy);
    if (view && !view.destroyed) {
      view.passes = [];
      view.destroy();
    }
  }
}

registerComponent("View3D", CanvasView3D);

/**
 * Renders a 3D scene inside the 2D canvas.
 *
 * @example
 * ```html
 * <View3D toneMapping="aces" environment={{ skyColor: 0xbcd4f0, groundColor: 0x6b6250, intensity: 0.7 }}>
 *   <Camera3D position={[0, 5, 10]} lookAt={[0, 0, 0]} orbit={true} />
 *   <DirectionalLight intensity={3} rotation={[-0.8, 0.5, 0]} castShadow={true} />
 *   <Mesh3D geometry={{ type: "cube" }} material={{ baseColor: 0xd9534f }} />
 * </View3D>
 * ```
 */
export const View3D: ComponentFunction<View3DProps> = (props) => createComponent("View3D", props);

export { CanvasView3D };
