import { Container, EventBoundary, FederatedPointerEvent } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { Container3D, ContainerTexture, FlatMaterial, Material3D, Mesh3D as PixiMesh3D, PlaneGeometry } from "@pixi/3d";
import { findViewComponent, Node3D, type Node3DProps } from "./Node3D";

export interface Surface3DProps extends Node3DProps {
  /** Size of the 2D area in pixels, `[width, height]`: the 2D children draw in it. Default `[512, 256]` */
  resolution?: [number, number];
  /** Width of the surface in world units; the height follows the 2D area's shape. Default 2 */
  width?: number;
  /** `false` (default): the 2D shows as lit from within, like a screen. `true`: lit like a poster */
  lit?: boolean;
  /** Colour behind the 2D content; transparent when left out */
  clearColor?: number | string;
  /** `"frame"` (default): redraws every frame. `"manual"`: only when `redraw()` is called */
  update?: "frame" | "manual";
  /** Draws both faces */
  doubleSided?: boolean;
  /**
   * Sends pointer events on the surface to its 2D children, so their `click`,
   * `pointerover`... work like on the stage. Default `true`
   */
  interactive2d?: boolean;
}

/** 3D pointer events on the surface, and the 2D event each one becomes. */
const FORWARDED_EVENTS: Record<string, string> = {
  pointerdown: "pointerdown",
  pointerup: "pointerup",
  pointermove: "pointermove",
  pointerupoutside: "pointerupoutside",
  pointerleave: "pointerout",
};

/**
 * A plane showing its 2D CanvasEngine children: a sign, a screen, a health bar over a
 * character. The children draw into a ContainerTexture, never on the stage.
 */
class CanvasSurface3D extends Node3D(PixiMesh3D) {
  /** Holds the 2D children */
  readonly content = new Container();
  texture2d: ContainerTexture | null = null;
  /** Hit-tests and dispatches pointer events in the 2D content, as the stage does */
  readonly boundary = new EventBoundary(this.content);
  #forwarders: [string, (event: any) => void][] = [];
  #lastPoint = { x: -1, y: -1 };

  /** 3D children go in the scene, 2D children in the texture's container. */
  addChild(...children: any[]) {
    for (const child of children) {
      if (child instanceof Container3D) super.addChild(child);
      else this.content.addChild(child);
    }
    return children[0];
  }

  addChildAt(child: any, index: number) {
    if (child instanceof Container3D) return super.addChildAt(child, index);
    return this.content.addChildAt(child, Math.min(index, this.content.children.length));
  }

  removeChild(...children: any[]) {
    for (const child of children) {
      if (child instanceof Container3D) super.removeChild(child);
      else this.content.removeChild(child);
    }
    return children[0];
  }

  applyProps3D(props: Surface3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (initial || "interactive2d" in props) this.#syncForwarding();
    if (initial || "resolution" in props || "width" in props || "lit" in props || "clearColor" in props || "doubleSided" in props) {
      this.#build();
    } else if (props.update !== undefined && this.texture2d) {
      this.texture2d.autoUpdate = props.update !== "manual";
    }
  }

  #build() {
    const renderer = this.element ? findViewComponent(this.element)?.renderer : null;
    const [width, height] = (this.fullProps.resolution as [number, number]) ?? [512, 256];
    const previous = this.texture2d;
    this.texture2d = new ContainerTexture({
      container: this.content,
      width,
      height,
      antialias: true,
      resolution: renderer?.resolution ?? 1,
      clearColor: this.fullProps.clearColor,
      renderer: renderer ?? undefined,
      autoUpdate: this.fullProps.update !== "manual",
    });

    const surfaceWidth = this.fullProps.width ?? 2;
    this.geometry?.destroy();
    this.geometry = new PlaneGeometry({ width: surfaceWidth, height: (surfaceWidth * height) / width });
    const options = {
      baseColorTexture: this.texture2d,
      // Transparent areas stay see-through unless a clear colour fills them
      alphaMode: this.fullProps.clearColor === undefined ? ("blend" as const) : ("opaque" as const),
      doubleSided: this.fullProps.doubleSided ?? false,
    };
    const previousMaterial = this.material;
    this.material = this.fullProps.lit ? new Material3D(options) : new FlatMaterial(options);
    previousMaterial?.destroy();
    // Keeps the container: it holds the 2D children
    previous?.destroy(true);
  }

  /** Listens to 3D pointer events on the surface and replays them in the 2D content. */
  #syncForwarding() {
    for (const [type, handler] of this.#forwarders) (this as any).off(type, handler);
    this.#forwarders = [];
    if (this.fullProps.interactive2d === false) return;
    const node = this as any;
    // The texture coordinate under the pointer needs a per-triangle hit test
    if (this.fullProps.hitVolume === undefined) node.hitVolume = "geometry";
    this._ensurePickable();
    for (const [from, to] of Object.entries(FORWARDED_EVENTS)) {
      const handler = (event: any) => this.#forward(to, event);
      node.on(from, handler);
      this.#forwarders.push([from, handler]);
    }
  }

  /** Turns a 3D event into a 2D one at the matching point of the 2D area. */
  #forward(type: string, event: any) {
    const [width, height] = (this.fullProps.resolution as [number, number]) ?? [512, 256];
    const hit = event.hit3D;
    if (hit && hit.target === this && hit.uv) {
      // A plane without flipV shows the 2D upright: v grows upward
      this.#lastPoint = { x: hit.uv.x * width, y: (1 - hit.uv.y) * height };
    } else if (type === "pointermove" || type === "pointerdown") {
      return;
    }
    const e = new FederatedPointerEvent(this.boundary);
    e.type = type;
    e.pointerId = event.pointerId;
    e.pointerType = event.pointerType;
    e.isPrimary = event.isPrimary;
    e.button = event.button;
    e.buttons = event.buttons;
    e.width = event.width;
    e.height = event.height;
    e.pressure = event.pressure;
    e.nativeEvent = event.nativeEvent;
    e.timeStamp = performance.now();
    e.global.set(this.#lastPoint.x, this.#lastPoint.y);
    e.screen.set(this.#lastPoint.x, this.#lastPoint.y);
    e.client.set(this.#lastPoint.x, this.#lastPoint.y);
    this.boundary.mapEvent(e);
    // Show the cursor of the 2D component under the pointer
    if (this.fullProps.cursor === undefined) (this as any).cursor = this.boundary.cursor ?? "default";
  }

  /** Redraws the 2D content, with `update="manual"`. */
  redraw() {
    this.texture2d?.render();
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    for (const [type, handler] of this.#forwarders) (this as any).off(type, handler);
    this.#forwarders = [];
    const texture = this.texture2d;
    const material = this.material;
    const geometry = this.geometry;
    this.texture2d = null;
    super.onDestroy(parent, afterDestroy);
    texture?.destroy(true);
    material?.destroy();
    geometry?.destroy();
    this.content.destroy();
  }
}

registerComponent("Surface3D", CanvasSurface3D);

/**
 * Shows 2D components on a plane in the 3D scene.
 *
 * @example
 * ```html
 * <Surface3D position={[0, 3, -4]} width={3} resolution={[512, 128]} clearColor={0x1b1430}>
 *   <Text text={score} x={256} y={64} anchor={0.5} size={64} color="#ffc46b" />
 * </Surface3D>
 * ```
 */
export const Surface3D: ComponentFunction<Surface3DProps> = (props) => createComponent("Surface3D", props);

export { CanvasSurface3D };
