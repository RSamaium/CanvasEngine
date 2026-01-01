import { isSignal, Signal } from "@signe/reactive";
import { Subscription } from "rxjs";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentFunction } from "../engine/signal";
import { arrayEquals, fps2ms, isBrowser, isFunction, preciseNow } from "../engine/utils";
import { DisplayObjectProps } from "./types/DisplayObject";
import { CanvasDOMElement } from "./DOMElement";
import { OnHook } from "./DisplayObject";
import { Tick } from "../directives/Scheduler";
import {
  AnimationFrames,
  FrameOptions,
  SpritesheetOptions,
  TextureOptions,
} from "./types/Spritesheet";

export interface DOMSpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DOMSpriteProps extends DisplayObjectProps {
  image?: string;
  rectangle?: DOMSpriteFrame | { value?: DOMSpriteFrame };
  frames?: DOMSpriteFrame[];
  frameIndex?: number;
  fps?: number;
  playing?: boolean;
  loop?: boolean;
  sheet?: {
    definition?:
    | DOMSpriteSheetDefinition
    | { value?: DOMSpriteSheetDefinition }
    | Signal<DOMSpriteSheetDefinition | undefined>
    | Promise<DOMSpriteSheetDefinition>;
    playing?: string;
    params?: any;
    onFinish?: () => void;
  };
  element?: "div" | "img";
  attrs?: Record<string, any> & {
    class?:
    | string
    | string[]
    | Record<string, boolean>
    | { items?: string[] }
    | { value?: string | string[] | Record<string, boolean> };
    style?:
    | string
    | Record<string, string | number>
    | { value?: string | Record<string, string | number> };
  };
  onBeforeDestroy?: OnHook;
  context?: {
    tick?: Signal<Tick | null>;
  };
}

const EVENTS = [
  "click",
  "mouseover",
  "mouseout",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseup",
  "mousedown",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "wheel",
  "scroll",
  "resize",
  "focus",
  "blur",
  "change",
  "input",
  "submit",
  "reset",
  "keydown",
  "keyup",
  "keypress",
  "contextmenu",
  "drag",
  "dragend",
  "dragenter",
  "dragleave",
  "dragover",
  "drop",
  "dragstart",
  "select",
  "selectstart",
  "selectend",
  "selectall",
  "selectnone",
];

type DOMSpriteTextureOptionsMerging = TextureOptions & {
  spriteWidth: number;
  spriteHeight: number;
  image?: string;
};

type DOMSpriteFrameOptions = FrameOptions & DOMSpriteFrame;

type DOMSpriteAnimationData = {
  frames: DOMSpriteFrameOptions[];
  animations: AnimationFrames;
  params: any[];
  data: DOMSpriteTextureOptionsMerging;
  name: string;
};

type DOMSpriteSheetDefinition = SpritesheetOptions & {
  image?: string;
};

export class CanvasDOMSprite extends CanvasDOMElement {
  private frameIndex = 0;
  private frames: DOMSpriteFrame[] = [];
  private rectangle?: DOMSpriteFrame;
  private image?: string;
  private fps = 12;
  private loop = true;
  private playing = false;
  private hasExternalFrameIndex = false;
  private elapsed = 0;
  private tickSignal?: Signal<Tick | null>;
  private tickSubscription?: Subscription;
  private sheetSubscriptions: Subscription[] = [];
  private sheetDefinition?: DOMSpriteSheetDefinition;
  private sheetAnimations: Map<string, DOMSpriteAnimationData> = new Map();
  private sheetCurrentAnimation?: DOMSpriteAnimationData;
  private sheetCurrentName?: string;
  private sheetParams: any = {};
  private sheetTime = 0;
  private sheetFrameIndex = 0;
  private sheetFinished = false;
  private sheetLoadToken = 0;
  private sheetOnFinish?: () => void;
  private rafId?: number;
  private lastRafTimestamp?: number;
  private lastTickTimestamp?: number;
  private elementType: "div" | "img" = "div";
  private isAnimating = false;
  private playingSubscription?: Subscription;
  private playingSignal?: Signal<boolean>;

  onInit(props: DOMSpriteProps) {
    this.elementType = props.element ?? "div";
    const nextProps = this.mergeEventAttrs({ ...props, element: this.elementType });
    this.tickSignal = nextProps.context?.tick;
    this.applyProps(nextProps);
    super.onInit(nextProps as any);
    this.render();
    this.updateAnimationLoop();
  }

  onMount(context: Element<CanvasDOMElement>) {
    this.tickSignal = context.props.context?.tick;
    super.onMount(context);
    this.bindPlayingSignal(context);
    this.bindSheetParams(context);
    this.updateAnimationLoop();
  }

  onUpdate(props: DOMSpriteProps) {
    const nextProps = this.mergeEventAttrs(props);
    super.onUpdate(nextProps as any);
    this.applyProps(nextProps);
    this.render();
    this.updateAnimationLoop();
  }

  async onDestroy(
    parent: Element<CanvasDOMElement>,
    afterDestroy: () => void
  ): Promise<void> {
    if (this.playingSubscription) {
      this.playingSubscription.unsubscribe();
      this.playingSubscription = undefined;
    }
    if (this.sheetSubscriptions.length > 0) {
      this.sheetSubscriptions.forEach((sub) => sub.unsubscribe());
      this.sheetSubscriptions = [];
    }
    this.stopAnimationLoop();
    await super.onDestroy(parent, afterDestroy);
  }

  private resolveRectangle(
    rectangle?: DOMSpriteFrame | { value?: DOMSpriteFrame } | Signal<DOMSpriteFrame | undefined>
  ): DOMSpriteFrame | undefined {
    if (!rectangle) return undefined;
    const signalResolved = isSignal(rectangle) ? rectangle() : rectangle;
    if (!signalResolved) return undefined;
    const resolved = (signalResolved as any).value ?? signalResolved;
    if (!resolved) return undefined;
    return resolved as DOMSpriteFrame;
  }

  private resolveSheetDefinition(
    definition?:
      | DOMSpriteSheetDefinition
      | { value?: DOMSpriteSheetDefinition }
      | Signal<DOMSpriteSheetDefinition | undefined>
      | Promise<DOMSpriteSheetDefinition>
  ): DOMSpriteSheetDefinition | Promise<DOMSpriteSheetDefinition | undefined> | undefined {
    if (!definition) return undefined;
    const signalResolved = isSignal(definition as any)
      ? (definition as any)()
      : definition;
    if (!signalResolved) return undefined;
    return (signalResolved as any).value ?? signalResolved;
  }

  private async detectImageDimensions(
    imagePath: string
  ): Promise<{ width: number; height: number }> {
    if (!isBrowser() || !imagePath) {
      return { width: 0, height: 0 };
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      img.src = imagePath;
    });
  }

  private async createSheetAnimations(definition: DOMSpriteSheetDefinition) {
    this.sheetAnimations.clear();
    const { textures } = definition;
    if (!textures) return;

    const parentProps: (keyof TextureOptions)[] = [
      "width",
      "height",
      "framesHeight",
      "framesWidth",
      "rectWidth",
      "rectHeight",
      "offset",
    ];

    for (const animationName in textures) {
      const baseOptions = parentProps.reduce(
        (prev, val) => ({ ...prev, [val]: (definition as any)[val] }),
        {}
      );
      const optionsTextures = {
        ...baseOptions,
        ...textures[animationName],
      } as DOMSpriteTextureOptionsMerging;
      optionsTextures.image =
        (textures[animationName] as any).image ?? definition.image;

      const {
        rectWidth,
        rectHeight,
        framesWidth = 1,
        framesHeight = 1,
        image,
      } = optionsTextures;

      let width = optionsTextures.width || 0;
      let height = optionsTextures.height || 0;

      if (image && ((!width || width <= 0) || (!height || height <= 0))) {
        const dimensions = await this.detectImageDimensions(image);
        if (!width || width <= 0) {
          width = dimensions.width;
        }
        if (!height || height <= 0) {
          height = dimensions.height;
        }
      }

      if (!width || !height || !framesWidth || !framesHeight) {
        continue;
      }

      optionsTextures.width = width;
      optionsTextures.height = height;
      optionsTextures.spriteWidth = rectWidth ? rectWidth : width / framesWidth;
      optionsTextures.spriteHeight = rectHeight ? rectHeight : height / framesHeight;

      this.sheetAnimations.set(animationName, {
        frames: [],
        name: animationName,
        animations: textures[animationName].animations,
        params: [],
        data: optionsTextures,
      });
    }
  }

  private async setSheetDefinition(
    definition?: DOMSpriteSheetDefinition | Promise<DOMSpriteSheetDefinition>
  ) {
    const token = ++this.sheetLoadToken;
    if (!definition) {
      this.sheetDefinition = undefined;
      this.sheetAnimations.clear();
      this.sheetCurrentAnimation = undefined;
      this.sheetCurrentName = undefined;
      return;
    }

    const resolved = await definition;
    if (token !== this.sheetLoadToken) return;
    if (!resolved) {
      this.sheetDefinition = undefined;
      this.sheetAnimations.clear();
      this.sheetCurrentAnimation = undefined;
      this.sheetCurrentName = undefined;
      return;
    }
    this.sheetDefinition = resolved;
    if (resolved.image) {
      this.image = resolved.image;
    }

    await this.createSheetAnimations(resolved);

    const textureKeys = resolved.textures ? Object.keys(resolved.textures) : [];
    const fallbackName =
      this.sheetCurrentName ||
      (textureKeys.includes("stand") ? "stand" : textureKeys[0]) ||
      undefined;
    if (fallbackName) {
      this.playSheet(fallbackName, [this.sheetParams]);
    }
    this.render();
    this.updateAnimationLoop();
  }

  private playSheet(name: string, params: any[] = []) {
    const animParams = this.sheetCurrentAnimation?.params;
    if (this.sheetCurrentAnimation && this.sheetCurrentAnimation.name === name) {
      if (arrayEquals(params, animParams || [])) return;
    }

    const animation = this.sheetAnimations.get(name);
    if (!animation) {
      throw new Error(
        `Impossible to play the ${name} animation because it doesn't exist on the spritesheet`
      );
    }

    const cloneParams = structuredClone(params);
    let animations: any = animation.animations;
    animations = isFunction(animations) ? (animations as Function)(...cloneParams) : animations;

    animation.frames = [];
    animation.params = cloneParams;
    this.sheetCurrentAnimation = animation;
    this.sheetCurrentName = name;
    this.sheetTime = 0;
    this.sheetFrameIndex = 0;
    this.sheetFinished = false;

    const data = animation.data;
    const spriteWidth = data.spriteWidth;
    const spriteHeight = data.spriteHeight;
    const offsetX = data.offset?.x ?? 0;
    const offsetY = data.offset?.y ?? 0;

    for (const container of animations as FrameOptions[][]) {
      for (const frame of container) {
        const frameX = frame.frameX ?? 0;
        const frameY = frame.frameY ?? 0;
        animation.frames.push({
          ...frame,
          x: frameX * spriteWidth + offsetX,
          y: frameY * spriteHeight + offsetY,
          width: spriteWidth,
          height: spriteHeight,
        });
      }
    }

    this.render();
    this.updateAnimationLoop();
  }

  private getCurrentSheetFrame(): DOMSpriteFrame | null {
    if (!this.sheetCurrentAnimation || this.sheetCurrentAnimation.frames.length === 0) {
      return null;
    }
    return this.sheetCurrentAnimation.frames[this.sheetFrameIndex] ?? null;
  }

  private advanceSheet(tick: Tick) {
    if (!this.playing || !this.sheetCurrentAnimation) return;

    const frames = this.sheetCurrentAnimation.frames;
    if (frames.length <= 1) return;

    const deltaRatio =
      tick.deltaRatio ??
      (tick.deltaTime ? tick.deltaTime / fps2ms(60) : 0);

    const nextFrame = frames[this.sheetFrameIndex + 1];
    if (!nextFrame) {
      if (this.loop) {
        this.sheetTime = 0;
        this.sheetFrameIndex = 0;
        this.applyFrame(frames[0]);
        return;
      } else if (!this.sheetFinished) {
        this.sheetFinished = true;
        if (this.sheetOnFinish) this.sheetOnFinish();
      }
      this.applyFrame(frames[frames.length - 1]);
      return;
    }

    this.sheetTime += deltaRatio || 0;
    if (this.sheetTime >= nextFrame.time) {
      this.sheetFrameIndex += 1;
    }
    this.applyFrame(frames[this.sheetFrameIndex]);
  }

  private mergeEventAttrs(props: DOMSpriteProps): DOMSpriteProps {
    let merged = props.attrs ? { ...props.attrs } : undefined;
    for (const event of EVENTS) {
      const handler = (props as any)[event];
      if (handler && !merged?.[event]) {
        if (!merged) merged = {};
        merged[event] = handler;
      }
    }
    if (!merged) return props;
    return { ...props, attrs: merged };
  }

  private applyProps(props: DOMSpriteProps) {
    if (props.image !== undefined) {
      this.image = isSignal(props.image as any) ? (props.image as any)() : props.image;
    }
    if (props.rectangle !== undefined) {
      this.rectangle = this.resolveRectangle(props.rectangle);
    }
    if (props.frames !== undefined) {
      const resolvedFrames = isSignal(props.frames as any)
        ? (props.frames as any)()
        : props.frames;
      this.frames = resolvedFrames ?? [];
    }
    if (props.sheet !== undefined) {
      const resolvedSheet = isSignal(props.sheet as any)
        ? (props.sheet as any)()
        : props.sheet;
      if (resolvedSheet?.definition !== undefined) {
        const resolvedDefinition = this.resolveSheetDefinition(resolvedSheet.definition);
        if (resolvedDefinition instanceof Promise) {
          void this.setSheetDefinition(resolvedDefinition);
        } else if (resolvedDefinition && resolvedDefinition !== this.sheetDefinition) {
          void this.setSheetDefinition(resolvedDefinition);
        }
      }
      if (resolvedSheet?.params !== undefined) {
        this.sheetParams = { ...this.sheetParams, ...resolvedSheet.params };
      }
      if (resolvedSheet?.playing !== undefined) {
        this.sheetCurrentName = resolvedSheet.playing;
      }
      if (resolvedSheet?.onFinish !== undefined) {
        this.sheetOnFinish = resolvedSheet.onFinish;
      }
      if (this.sheetAnimations.size > 0 && this.sheetCurrentName) {
        this.playSheet(this.sheetCurrentName, [this.sheetParams]);
      }
    }
    if (props.frameIndex !== undefined) {
      const isFrameIndexSignal = isSignal(props.frameIndex as any);
      const resolvedIndex = isFrameIndexSignal
        ? (props.frameIndex as any)()
        : props.frameIndex;
      if (resolvedIndex !== undefined) {
        this.frameIndex = resolvedIndex;
      }
      this.hasExternalFrameIndex = isFrameIndexSignal;
    }
    if (props.fps !== undefined) {
      const resolvedFps = isSignal(props.fps as any) ? (props.fps as any)() : props.fps;
      if (resolvedFps !== undefined) {
        this.fps = resolvedFps;
      }
    }
    if (props.playing !== undefined) {
      const resolvedPlaying = isSignal(props.playing as any)
        ? (props.playing as any)()
        : props.playing;
      this.playing = resolvedPlaying === true;
      if (!this.playing) {
        this.elapsed = 0;
      }
    }
    if (props.loop !== undefined) {
      const resolvedLoop = isSignal(props.loop as any) ? (props.loop as any)() : props.loop;
      if (resolvedLoop !== undefined) {
        this.loop = resolvedLoop;
      }
    }
  }

  private bindPlayingSignal(context: Element<CanvasDOMElement>) {
    const playingValue = context.propObservables?.playing as any;
    if (!playingValue || !isSignal(playingValue)) return;
    if (this.playingSignal === playingValue) return;

    if (this.playingSubscription) {
      this.playingSubscription.unsubscribe();
      this.playingSubscription = undefined;
    }

    this.playingSignal = playingValue;
    this.playing = playingValue();
    this.playingSubscription = playingValue.observable.subscribe((value) => {
      this.playing = value === true;
      if (!this.playing) {
        this.elapsed = 0;
      }
      this.updateAnimationLoop();
    });
  }

  private bindSheetParams(context: Element<CanvasDOMElement>) {
    const params = context.propObservables?.sheet?.params as any;
    if (!params || typeof params !== "object") return;
    for (const key in params) {
      const value = params[key];
      if (!isSignal(value)) continue;
      this.sheetSubscriptions.push(
        value.observable.subscribe((nextValue) => {
          this.sheetParams = { ...this.sheetParams, [key]: nextValue };
          if (this.sheetCurrentName) {
            this.playSheet(this.sheetCurrentName, [this.sheetParams]);
          }
        })
      );
    }
  }

  private getFrames(): DOMSpriteFrame[] {
    if (this.frames && this.frames.length > 0) return this.frames;
    if (this.rectangle) return [this.rectangle];
    return [];
  }

  private normalizeIndex(index: number, length: number) {
    if (length <= 0) return 0;
    if (this.loop) {
      const mod = index % length;
      return mod < 0 ? mod + length : mod;
    }
    if (index < 0) return 0;
    if (index >= length) return length - 1;
    return index;
  }

  private render() {
    if (!this.element) return;
    const sheetFrame = this.getCurrentSheetFrame();
    if (sheetFrame) {
      this.applyFrame(sheetFrame);
      return;
    }
    const frames = this.getFrames();
    if (frames.length === 0) {
      if (this.elementType === "img" && this.image) {
        (this.element as HTMLImageElement).src = this.image;
      } else if (this.image) {
        this.element.style.backgroundImage = `url("${this.image}")`;
      }
      return;
    }

    const normalizedIndex = this.normalizeIndex(this.frameIndex, frames.length);
    if (normalizedIndex !== this.frameIndex && !this.loop) {
      this.frameIndex = normalizedIndex;
    }

    const frame = frames[normalizedIndex];
    this.applyFrame(frame);
  }

  private applyFrame(frame: DOMSpriteFrame) {
    if (!this.element) return;
    this.element.style.width = `${frame.width}px`;
    this.element.style.height = `${frame.height}px`;

    const x = frame.x ?? 0;
    const y = frame.y ?? 0;

    if (this.elementType === "img") {
      const img = this.element as HTMLImageElement;
      if (this.image) {
        img.src = this.image;
      }
      img.style.objectFit = "none";
      img.style.objectPosition = `-${x}px -${y}px`;
      return;
    }

    if (this.image) {
      this.element.style.backgroundImage = `url("${this.image}")`;
    }
    this.element.style.backgroundRepeat = "no-repeat";
    this.element.style.backgroundPosition = `-${x}px -${y}px`;
  }

  private updateAnimationLoop() {
    const sheetFrames = this.sheetCurrentAnimation?.frames ?? [];
    const shouldAnimate = this.sheetCurrentAnimation
      ? this.playing && sheetFrames.length > 1
      : this.playing &&
      !this.hasExternalFrameIndex &&
      this.getFrames().length > 1 &&
      this.fps > 0;

    if (shouldAnimate) {
      this.startAnimationLoop();
    } else {
      this.stopAnimationLoop();
    }
  }

  private startAnimationLoop() {
    if (this.tickSubscription || this.rafId !== undefined) {
      this.stopAnimationLoop();
    }
    this.isAnimating = true;
    this.elapsed = 0;
    this.lastTickTimestamp = undefined;

    if (this.tickSignal?.observable) {
      this.tickSubscription = this.tickSignal.observable.subscribe((result: any) => {
        const tick = result?.value ?? result;
        if (!tick) return;
        if (this.sheetCurrentAnimation) {
          this.advanceSheet(tick);
          return;
        }
        let deltaTime = tick.deltaTime || 0;
        if (deltaTime <= 0) {
          const now = preciseNow();
          if (this.lastTickTimestamp === undefined) {
            this.lastTickTimestamp = now;
            return;
          }
          deltaTime = now - this.lastTickTimestamp;
          this.lastTickTimestamp = now;
        }
        if (deltaTime > 0) {
          this.advance(deltaTime);
        }
      });
      return;
    }

    const step = (timestamp: number) => {
      if (!this.playing || this.hasExternalFrameIndex) {
        this.stopAnimationLoop();
        return;
      }
      if (this.lastRafTimestamp === undefined) {
        this.lastRafTimestamp = timestamp;
      }
      const delta = timestamp - this.lastRafTimestamp;
      this.lastRafTimestamp = timestamp;
      if (this.sheetCurrentAnimation) {
        this.advanceSheet({
          timestamp,
          deltaTime: delta,
          frame: 0,
          deltaRatio: delta / fps2ms(60),
        });
      } else {
        this.advance(delta);
      }

      if (isBrowser()) {
        this.rafId = window.requestAnimationFrame(step);
      } else {
        this.rafId = setTimeout(() => {
          step(preciseNow());
        }, fps2ms(this.fps)) as unknown as number;
      }
    };

    if (isBrowser()) {
      this.rafId = window.requestAnimationFrame(step);
    } else {
      this.rafId = setTimeout(() => {
        step(preciseNow());
      }, fps2ms(this.fps)) as unknown as number;
    }
  }

  private stopAnimationLoop() {
    this.isAnimating = false;
    if (this.tickSubscription) {
      this.tickSubscription.unsubscribe();
      this.tickSubscription = undefined;
    }
    if (this.rafId !== undefined) {
      if (isBrowser()) {
        window.cancelAnimationFrame(this.rafId);
      } else {
        clearTimeout(this.rafId);
      }
      this.rafId = undefined;
      this.lastRafTimestamp = undefined;
    }
    this.lastTickTimestamp = undefined;
  }

  private advance(deltaTime: number) {
    const frames = this.getFrames();
    if (!this.playing || frames.length <= 1 || this.fps <= 0) return;

    this.elapsed += deltaTime;
    const frameDuration = fps2ms(this.fps);

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex += 1;
      if (!this.loop && this.frameIndex >= frames.length) {
        this.frameIndex = frames.length - 1;
        break;
      }
    }

    this.render();
  }
}

registerComponent("DOMSprite", CanvasDOMSprite);

export const DOMSprite: ComponentFunction<DOMSpriteProps> = (props) => {
  return createComponent("DOMSprite", props);
};
