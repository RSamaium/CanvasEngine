import { isSignal, Signal } from "@signe/reactive";
import { Subscription } from "rxjs";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentFunction } from "../engine/signal";
import { fps2ms, isBrowser, preciseNow } from "../engine/utils";
import { DisplayObjectProps } from "./types/DisplayObject";
import { CanvasDOMElement } from "./DOMElement";
import { OnHook } from "./DisplayObject";
import { Tick } from "../directives/Scheduler";

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
    const frames = this.getFrames();
    const shouldAnimate =
      this.playing &&
      !this.hasExternalFrameIndex &&
      frames.length > 1 &&
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
      this.advance(delta);

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
