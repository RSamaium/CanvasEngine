import { Container, Point, Ticker } from "pixi.js";
import { createComponent, DisplayObject, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { findViewComponent } from "./Node3D";
import { resolveObjectChanges, toVec3, type Vec3Input } from "./utils";

export interface Label3DProps {
  /** World position the label is pinned to: `[x, y, z]` */
  at?: Vec3Input;
  /** Offset on screen in pixels, `[x, y]`, e.g. `[0, -20]` to sit above the point */
  offset?: [number, number];
  /** Hides the label while its point is behind the camera. Default `true` */
  hideBehind?: boolean;
  [key: string]: any;
}

/**
 * A 2D container pinned over a point of the 3D scene: names over characters, damage
 * numbers, markers. It always draws over the 3D. Place it inside a `<View3D>`.
 */
class CanvasLabel3D extends DisplayObject(Container) {
  #at: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  #offset: [number, number] = [0, 0];
  #hideBehind = true;
  #view: any = null;
  #screen = new Point();
  #tick = () => this.#place();

  onInit(props: Label3DProps) {
    super.onInit(props);
    this.#read(resolveObjectChanges({ ...props }, {}));
  }

  async onMount(element: Element<any>, index?: number) {
    await super.onMount(element, index);
    this.#view = findViewComponent(element)?.view ?? null;
    if (!this.#view) {
      console.warn("<Label3D> must be placed inside a <View3D>");
      return;
    }
    Ticker.shared.add(this.#tick);
    this.#place();
  }

  onUpdate(props: Label3DProps) {
    props = resolveObjectChanges(props, { at: this.#at });
    const { at, offset, hideBehind, ...rest } = props;
    super.onUpdate(rest);
    this.#read(props);
    this.#place();
  }

  #read(props: Label3DProps) {
    const at = toVec3(props.at);
    if (at) this.#at = at;
    if (props.offset) this.#offset = props.offset;
    if (props.hideBehind !== undefined) this.#hideBehind = props.hideBehind;
  }

  #place() {
    const view = this.#view;
    if (!view || this.destroyed) return;
    const screen = view.worldToScreen(this.#at, this.#screen);
    if (!screen) {
      if (this.#hideBehind) this.renderable = false;
      return;
    }
    this.renderable = true;
    // worldToScreen gives canvas pixels; the label lives in the view's 2D space
    const local = this.parent ? this.parent.toLocal(screen) : screen;
    this.position.set(local.x + this.#offset[0], local.y + this.#offset[1]);
  }

  async onDestroy(parent: Element, afterDestroy: () => void) {
    Ticker.shared.remove(this.#tick);
    this.#view = null;
    await super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("Label3D", CanvasLabel3D);

/**
 * Pins 2D children over a point of the 3D scene.
 *
 * @example
 * ```html
 * <Label3D at={heroHead} offset={[0, -10]}>
 *   <Text text="Hero" anchor={{ x: 0.5, y: 1 }} color="#ffffff" size={14} />
 * </Label3D>
 * ```
 */
export const Label3D: ComponentFunction<Label3DProps> = (props) => createComponent("Label3D", props);

export { CanvasLabel3D };
