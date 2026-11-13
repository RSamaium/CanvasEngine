import { Assets, groupD8, Rectangle, Texture } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import { Sprite3D as PixiSprite3D } from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";

export interface Sprite3DProps extends Node3DProps {
  /** Image URL */
  image?: string;
  /** Texture, used instead of `image` */
  texture?: Texture;
  /** Part of the image to show, in pixels: a sprite-sheet cell. Animate it with a signal. */
  frame?: { x: number; y: number; width: number; height: number };
  /** Mirrors the image left to right */
  flipX?: boolean;
  /** World units per image pixel (default 0.01: a 512 px image is 5.12 units wide) */
  pixelSize?: number;
  /** Point of the image placed on `position`: a number or `{ x, y }`, default the centre */
  anchor?: number | { x: number; y: number };
  tint?: number | string;
  alpha?: number;
  /** `"blend"` (default, soft edges) or `"mask"` (hard cut-out, no sorting) */
  alphaMode?: "opaque" | "blend" | "mask";
  alphaCutoff?: number;
  /** `"spherical"` (default, flat to the screen), `"cylindrical"` (stays upright) or `"none"` */
  billboardMode?: "none" | "spherical" | "cylindrical";
  /** Width in world units; overrides `pixelSize` */
  width?: number;
  /** Height in world units; overrides `pixelSize` */
  height?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const SPRITE_FIELDS = ["pixelSize", "tint", "alpha", "alphaMode", "alphaCutoff", "billboardMode", "castShadow", "receiveShadow"] as const;

class CanvasSprite3D extends Node3D(PixiSprite3D) {
  #textureVersion = 0;
  /** Frame or mirror texture made by this component, destroyed when replaced */
  #derived: Texture | null = null;

  applyProps3D(props: Sprite3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    for (const key of SPRITE_FIELDS) {
      if (props[key] !== undefined) (this as any)[key] = props[key];
    }
    if (props.anchor !== undefined) this.anchor = props.anchor;
    if (initial || "image" in props || "texture" in props || "frame" in props || "flipX" in props) {
      this.#syncTexture();
    } else {
      this.#applySize(props);
    }
  }

  async #syncTexture() {
    const version = ++this.#textureVersion;
    const { image, texture, frame, flipX } = this.fullProps as Sprite3DProps;
    let base = texture ?? null;
    if (!base && image) base = await Assets.load<Texture>(image);
    if (version !== this.#textureVersion || this.destroyed || !base) return;

    let next = base;
    if (frame || flipX) {
      next = new Texture({
        source: base.source,
        frame: frame ? new Rectangle(frame.x, frame.y, frame.width, frame.height) : base.frame.clone(),
        rotate: flipX ? groupD8.MIRROR_HORIZONTAL : 0,
      });
    }
    const previous = this.#derived;
    this.texture = next;
    this.#derived = next === base ? null : next;
    if (previous && previous !== next) previous.destroy(false);
    // A new texture resizes the sprite: re-apply the anchor and explicit sizes
    this.anchor = this.fullProps.anchor ?? this.anchor;
    this.#applySize(this.fullProps);
  }

  #applySize(props: Sprite3DProps) {
    if (props.width !== undefined) this.width = props.width;
    if (props.height !== undefined) this.height = props.height;
  }

  onDestroy(parent: any, afterDestroy?: () => void) {
    this.#textureVersion++;
    const derived = this.#derived;
    this.#derived = null;
    super.onDestroy(parent, afterDestroy);
    derived?.destroy(false);
  }
}

registerComponent("Sprite3D", CanvasSprite3D);

/**
 * A flat image in the 3D scene that turns to face the camera.
 *
 * @example
 * ```html
 * <Sprite3D image="./tree.png" position={[2, 0, -3]} anchor={{ x: 0.5, y: 1 }} billboardMode="cylindrical" alphaMode="mask" />
 * ```
 */
export const Sprite3D: ComponentFunction<Sprite3DProps> = (props) => createComponent("Sprite3D", props);

export { CanvasSprite3D };
