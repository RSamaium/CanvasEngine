import { Assets, groupD8, Rectangle, Texture, Ticker } from "pixi.js";
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
  /**
   * Sprite-sheet animation, in the same format as the 2D `Sprite`:
   * `{ definition, playing, params, onFinish }`. Overrides `image` and `frame`.
   */
  sheet?: SheetProp;
}

/** One key frame: `time` in 1/60 s ticks from the start, and the cell to show. */
interface SheetFrame {
  time: number;
  frameX?: number;
  frameY?: number;
  /** Opacity at this frame */
  opacity?: number;
  anchor?: number[];
}

interface SheetTexture {
  image?: string;
  framesWidth?: number;
  framesHeight?: number;
  width?: number;
  height?: number;
  rectWidth?: number;
  rectHeight?: number;
  offset?: { x: number; y: number };
  animations: SheetFrame[][] | ((...args: any[]) => SheetFrame[][]);
}

export interface SheetDefinition extends Omit<SheetTexture, "animations"> {
  textures: Record<string, Partial<SheetTexture> & Pick<SheetTexture, "animations">>;
}

export interface SheetProp {
  definition?: SheetDefinition;
  /** Name of the animation to play, a key of `definition.textures` */
  playing?: string;
  /** Passed to `animations` when it is a function */
  params?: Record<string, any>;
  /** Called each time the animation reaches its end */
  onFinish?: () => void;
}

const SPRITE_FIELDS = ["pixelSize", "tint", "alpha", "alphaMode", "alphaCutoff", "billboardMode", "castShadow", "receiveShadow"] as const;

class CanvasSprite3D extends Node3D(PixiSprite3D) {
  #textureVersion = 0;
  /** Frame or mirror texture made by this component, destroyed when replaced */
  #derived: Texture | null = null;
  /** Sheet playback: loaded images, cut cells, current frames and clock */
  #sheetImages = new Map<string, Texture>();
  #sheetCells = new Map<string, Texture>();
  #sheetFrames: SheetFrame[] = [];
  #sheetData: SheetTexture | null = null;
  #sheetKey = "";
  #sheetTime = 0;
  #sheetIndex = 0;
  #sheetVersion = 0;
  #sheetTick = (ticker: Ticker) => this.#advanceSheet(ticker.deltaTime);
  #sheetTicking = false;

  applyProps3D(props: Sprite3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    for (const key of SPRITE_FIELDS) {
      if (props[key] !== undefined) (this as any)[key] = props[key];
    }
    if (props.anchor !== undefined) this.anchor = props.anchor;
    if (this.fullProps.sheet) {
      if (initial || "sheet" in props) this.#syncSheet();
      else if ("flipX" in props) this.#showSheetFrame();
      this.#applySize(props);
      return;
    }
    this.#stopSheet();
    if (initial || "image" in props || "texture" in props || "frame" in props || "flipX" in props || "sheet" in props) {
      this.#syncTexture();
    } else {
      this.#applySize(props);
    }
  }

  /** Loads the sheet's images, then (re)starts the animation when `playing` or `params` changed. */
  async #syncSheet() {
    const sheet = this.fullProps.sheet as SheetProp;
    const definition = sheet.definition;
    const name = sheet.playing;
    const texture = name ? definition?.textures?.[name] : undefined;
    if (!definition || !texture) {
      if (name) console.warn(`<Sprite3D> no sheet animation named "${name}"`);
      this.#stopSheet();
      return;
    }
    const version = ++this.#sheetVersion;
    // Like the 2D Sprite, an animation inherits the sheet's cutting options
    const data: SheetTexture = { ...definition, ...texture } as SheetTexture;
    const image = data.image;
    if (!image) return;
    if (!this.#sheetImages.has(image)) {
      const loaded = await Assets.load<Texture>(image);
      if (version !== this.#sheetVersion || this.destroyed) return;
      this.#sheetImages.set(image, loaded);
    }

    const key = JSON.stringify([name, sheet.params ?? null]);
    if (key !== this.#sheetKey) {
      const layers = typeof data.animations === "function" ? data.animations(sheet.params ?? {}) : data.animations;
      // A 3D sprite shows one layer: the first
      this.#sheetFrames = [...(layers?.[0] ?? [])].sort((a, b) => a.time - b.time);
      this.#sheetData = data;
      this.#sheetKey = key;
      this.#sheetTime = 0;
      this.#sheetIndex = 0;
    }
    this.#showSheetFrame();
    if (!this.#sheetTicking) {
      Ticker.shared.add(this.#sheetTick);
      this.#sheetTicking = true;
    }
  }

  /** Same clock as the 2D Sprite: `time` counts 1/60 s ticks and loops after the last frame. */
  #advanceSheet(deltaTicks: number) {
    const frames = this.#sheetFrames;
    if (frames.length < 2) return;
    const elapsed = Number.isFinite(deltaTicks) && deltaTicks >= 0 ? deltaTicks : 1;
    this.#sheetTime += elapsed;
    const last = frames[frames.length - 1];
    if (this.#sheetTime >= last.time && this.#sheetIndex === frames.length - 1) {
      // Carry the time past the last frame over to the next loop
      this.#sheetTime = Math.max(0, this.#sheetTime - last.time);
      this.#sheetIndex = 0;
      (this.fullProps.sheet as SheetProp)?.onFinish?.();
    }
    const before = this.#sheetIndex;
    while (frames[this.#sheetIndex + 1] && this.#sheetTime >= frames[this.#sheetIndex + 1].time) this.#sheetIndex++;
    if (this.#sheetIndex !== before || this.#sheetIndex === 0) this.#showSheetFrame();
  }

  /** Shows the current key frame's cell. */
  #showSheetFrame() {
    const data = this.#sheetData;
    const frame = this.#sheetFrames[this.#sheetIndex];
    const base = data?.image ? this.#sheetImages.get(data.image) : undefined;
    if (!data || !frame || !base) return;
    const imageWidth = data.width || base.width;
    const imageHeight = data.height || base.height;
    const cellWidth = data.rectWidth ?? imageWidth / (data.framesWidth ?? 1);
    const cellHeight = data.rectHeight ?? imageHeight / (data.framesHeight ?? 1);
    const x = (frame.frameX ?? 0) * cellWidth + (data.offset?.x ?? 0);
    const y = (frame.frameY ?? 0) * cellHeight + (data.offset?.y ?? 0);
    const flip = !!this.fullProps.flipX;
    const cacheKey = `${data.image}|${x}|${y}|${cellWidth}|${cellHeight}|${flip}`;
    let cell = this.#sheetCells.get(cacheKey);
    if (!cell) {
      cell = new Texture({
        source: base.source,
        frame: new Rectangle(x, y, cellWidth, cellHeight),
        rotate: flip ? groupD8.MIRROR_HORIZONTAL : 0,
      });
      this.#sheetCells.set(cacheKey, cell);
    }
    if (this.texture !== cell) {
      this.texture = cell;
      this.anchor = (frame.anchor as any) ?? this.fullProps.anchor ?? this.anchor;
      this.#applySize(this.fullProps);
    }
    if (frame.opacity !== undefined) this.alpha = frame.opacity * (this.fullProps.alpha ?? 1);
  }

  #stopSheet() {
    if (this.#sheetTicking) Ticker.shared.remove(this.#sheetTick);
    this.#sheetTicking = false;
    this.#sheetVersion++;
    this.#sheetKey = "";
    this.#sheetFrames = [];
    this.#sheetData = null;
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
    this.#stopSheet();
    const derived = this.#derived;
    const cells = [...this.#sheetCells.values()];
    this.#derived = null;
    this.#sheetCells.clear();
    super.onDestroy(parent, afterDestroy);
    derived?.destroy(false);
    for (const cell of cells) cell.destroy(false);
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
