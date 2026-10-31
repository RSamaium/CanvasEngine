import { isSignal } from "@signe/reactive";
import { Container, Sprite as PixiSprite } from "pixi.js";
import type { Subscription } from "rxjs";
import type { SignalOrPrimitive } from "../components/types";
import { Directive, registerDirective } from "../engine/directive";
import type { Element } from "../engine/reactive";

export type AfterimageProps = {
  /**
   * Leaves ghosts behind while `true`. Bind a signal to switch it on a key press.
   * @default true
   */
  enabled?: SignalOrPrimitive<boolean>;
  /**
   * Time between two ghosts, in ms
   * @default 45
   */
  interval?: SignalOrPrimitive<number>;
  /**
   * Time for a ghost to fade out, in ms
   * @default 320
   */
  duration?: SignalOrPrimitive<number>;
  /**
   * Starting opacity of a ghost
   * @default 0.5
   */
  alpha?: SignalOrPrimitive<number>;
  /**
   * Tint of the ghosts
   * @default 0x7fd0ff
   */
  tint?: SignalOrPrimitive<number>;
  /**
   * Blend mode of the ghosts
   * @default 'add'
   */
  blendMode?: SignalOrPrimitive<string>;
  /**
   * Distance in px the object must have moved since the last ghost. `0` also ghosts a still object.
   * @default 1
   */
  minDistance?: SignalOrPrimitive<number>;
};

type Ghost = { sprite: PixiSprite; age: number };

const valueOf = <T>(value: SignalOrPrimitive<T> | T | undefined, fallback: T): T => {
  if (value === undefined) return fallback;
  return isSignal(value as any) ? (value as any)() : (value as T);
};

/**
 * Afterimage directive: leaves fading, tinted copies of a sprite's current frame behind it while it moves,
 * a "time dilation" look for a dash or a haste buff.
 *
 * @example
 * ```html
 * <Sprite image="hero.png" afterimage={{ enabled: dashing, tint: 0x66ccff }} />
 * ```
 */
export class Afterimage extends Directive {
  private elementRef: Element<Container> | null = null;
  private tickSubscription: Subscription | null = null;
  private ghosts: Ghost[] = [];
  private elapsed = 0;
  private started = false;
  private lastGhostX = 0;
  private lastGhostY = 0;

  onInit(element: Element<Container>) {
    this.elementRef = element;
  }

  onMount(element: Element<Container>) {
    const tick = element.props.context?.tick;
    this.tickSubscription =
      tick?.observable?.subscribe((event: { value?: { deltaTime?: number } }) => {
        this.update(event?.value?.deltaTime ?? tick()?.deltaTime ?? 16.67);
      }) ?? null;
  }

  onUpdate() {}

  onDestroy() {
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;
    for (const ghost of this.ghosts) this.removeGhost(ghost);
    this.ghosts = [];
    this.elementRef = null;
  }

  private get props(): AfterimageProps {
    const raw = valueOf<AfterimageProps | boolean | undefined>(this.elementRef?.props.afterimage, undefined);
    return raw && typeof raw === "object" ? raw : {};
  }

  private update(deltaMs: number) {
    const instance = this.elementRef?.componentInstance as any;
    if (!instance) return;
    const props = this.props;
    const duration = valueOf(props.duration, 320);
    const startAlpha = valueOf(props.alpha, 0.5);

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const ghost = this.ghosts[i];
      ghost.age += deltaMs;
      if (ghost.age >= duration) {
        this.removeGhost(ghost);
        this.ghosts.splice(i, 1);
      } else {
        ghost.sprite.alpha = startAlpha * (1 - ghost.age / duration);
      }
    }

    if (!this.started) {
      this.started = true;
      this.lastGhostX = instance.x;
      this.lastGhostY = instance.y;
    }
    if (!valueOf(props.enabled, true) || !instance.texture || !instance.parent) {
      this.elapsed = 0;
      this.lastGhostX = instance.x;
      this.lastGhostY = instance.y;
      return;
    }

    this.elapsed += deltaMs;
    if (this.elapsed < valueOf(props.interval, 45)) return;
    this.elapsed = 0;

    const moved = Math.hypot(instance.x - this.lastGhostX, instance.y - this.lastGhostY);
    if (moved < valueOf(props.minDistance, 1)) return;
    this.lastGhostX = instance.x;
    this.lastGhostY = instance.y;
    this.spawnGhost(instance, props, startAlpha);
  }

  private spawnGhost(instance: any, props: AfterimageProps, startAlpha: number) {
    const sprite = new PixiSprite(instance.texture);
    sprite.position.set(instance.x, instance.y);
    sprite.scale.copyFrom(instance.scale);
    sprite.pivot?.copyFrom?.(instance.pivot);
    sprite.rotation = instance.rotation ?? 0;
    sprite.anchor?.copyFrom?.(instance.anchor);
    sprite.tint = valueOf(props.tint, 0x7fd0ff);
    sprite.blendMode = valueOf(props.blendMode, "add") as any;
    sprite.alpha = startAlpha;
    sprite.zIndex = (instance.zIndex ?? 0) - 0.01;
    // right under the object, so it stays in front of what is behind it
    const parent = instance.parent as Container;
    const index = parent.getChildIndex?.(instance) ?? 0;
    parent.addChildAt(sprite, Math.max(0, index));
    this.ghosts.push({ sprite, age: 0 });
  }

  private removeGhost(ghost: Ghost) {
    ghost.sprite.parent?.removeChild(ghost.sprite);
    ghost.sprite.destroy();
  }
}

registerDirective("afterimage", Afterimage);
