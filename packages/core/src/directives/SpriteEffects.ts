import { effect, isSignal } from "@signe/reactive";
import { Container, Graphics, Rectangle, Sprite as PixiSprite } from "pixi.js";
import { OutlineFilter } from "pixi-filters/outline";
import { Directive, registerDirective } from "../engine/directive";
import { isElement } from "../engine/reactive";
import type { Element } from "../engine/reactive";
import type { SignalOrPrimitive } from "../components/types";
import type { Subscription } from "rxjs";

type MaybeSignal<T> = SignalOrPrimitive<T> | T;

const valueOf = <T>(value: MaybeSignal<T> | undefined, fallback: T): T => {
  if (value === undefined) return fallback;
  return isSignal(value as any) ? (value as any)() : (value as T);
};

const rawValueOf = <T>(value: MaybeSignal<T> | undefined): T | undefined => {
  if (value === undefined) return undefined;
  return isSignal(value as any) ? (value as any)() : (value as T);
};

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

const getFilters = (instance: Container): any[] => {
  const filters = (instance as any).filters;
  if (!filters) return [];
  return Array.isArray(filters) ? [...filters] : [filters];
};

const setFilters = (instance: Container, filters: any[]) => {
  (instance as any).filters = filters.length > 0 ? filters : [];
};

const getElementInstance = (value: unknown): Container | null => {
  const resolved = rawValueOf(value as any);
  if (isElement(resolved)) {
    return (resolved.componentInstance as unknown as Container) ?? null;
  }
  if (resolved instanceof Container) return resolved;
  if (resolved && typeof resolved === "object" && typeof (resolved as any).getBounds === "function") {
    return resolved as Container;
  }
  return null;
};

const normalizeBounds = (bounds: any): Rectangle => {
  return new Rectangle(bounds?.x ?? 0, bounds?.y ?? 0, bounds?.width ?? 0, bounds?.height ?? 0);
};

const getWorldBounds = (instance: any, mode: "bounds" | "hitbox" = "bounds"): Rectangle => {
  const bounds = normalizeBounds(
    typeof instance.getBounds === "function"
      ? instance.getBounds()
      : { x: instance.x ?? 0, y: instance.y ?? 0, width: instance.width ?? 0, height: instance.height ?? 0 }
  );

  if (mode !== "hitbox" || !instance.hitbox) {
    return bounds;
  }

  const hitbox = instance.hitbox;
  return new Rectangle(
    bounds.x + Math.max(0, (bounds.width - hitbox.w) / 2),
    bounds.y + Math.max(0, bounds.height - hitbox.h),
    hitbox.w,
    hitbox.h
  );
};

const intersectRect = (a: Rectangle, b: Rectangle): Rectangle | null => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const width = right - x;
  const height = bottom - y;
  if (width <= 0 || height <= 0) return null;
  return new Rectangle(x, y, width, height);
};

const drawFilledRect = (graphics: Graphics, rect: Rectangle) => {
  graphics.rect(rect.x, rect.y, rect.width, rect.height);
  graphics.fill(0xffffff);
};

const addMaskToParent = (instance: Container, mask: Graphics) => {
  if (mask.parent === instance.parent) return;
  if (mask.parent) {
    mask.parent.removeChild(mask);
  }
  instance.parent?.addChild(mask);
};

const setMask = (instance: any, mask: any, inverse = false) => {
  if (!instance) return;
  if (typeof instance.setMask === "function") {
    if (mask == null) {
      instance.mask = null;
    }
    instance.setMask({ mask: mask ?? null, inverse });
  } else {
    instance.mask = mask ?? null;
  }
};

const clearMask = (instance: any, fallbackMask: any) => {
  setMask(instance, fallbackMask ?? null);
};

const copyTransform = (target: any, source: any) => {
  const position = { x: source.x ?? source.position?.x ?? 0, y: source.y ?? source.position?.y ?? 0 };
  if (target.position?.copyFrom) {
    target.position.copyFrom(position);
  } else {
    target.x = position.x;
    target.y = position.y;
  }
  target.scale?.copyFrom?.(source.scale ?? { x: 1, y: 1 });
  target.pivot?.copyFrom?.(source.pivot ?? { x: 0, y: 0 });
  target.skew?.copyFrom?.(source.skew ?? { x: 0, y: 0 });
  target.rotation = source.rotation ?? 0;
};

const drawDisplayRect = (graphics: Graphics, instance: any, rect: Rectangle) => {
  copyTransform(graphics, instance);

  const textureWidth = instance.texture?.orig?.width ?? instance.texture?.width ?? instance.width ?? rect.width;
  const textureHeight = instance.texture?.orig?.height ?? instance.texture?.height ?? instance.height ?? rect.height;
  const displayWidth = instance.width || textureWidth || 1;
  const displayHeight = instance.height || textureHeight || 1;
  const anchorX = instance.anchor?.x ?? 0;
  const anchorY = instance.anchor?.y ?? 0;

  drawFilledRect(
    graphics,
    new Rectangle(
      -anchorX * textureWidth + (rect.x * textureWidth) / displayWidth,
      -anchorY * textureHeight + (rect.y * textureHeight) / displayHeight,
      (rect.width * textureWidth) / displayWidth,
      (rect.height * textureHeight) / displayHeight
    )
  );
};

export type OutlineProps = {
  enabled?: SignalOrPrimitive<boolean>;
  color?: SignalOrPrimitive<number>;
  thickness?: SignalOrPrimitive<number>;
  quality?: SignalOrPrimitive<number>;
  alpha?: SignalOrPrimitive<number>;
};

export type ClipShape =
  | {
      type: "rect";
      x: SignalOrPrimitive<number>;
      y: SignalOrPrimitive<number>;
      width: SignalOrPrimitive<number>;
      height: SignalOrPrimitive<number>;
    };

export type ClipProps = {
  enabled?: SignalOrPrimitive<boolean>;
  mode?: SignalOrPrimitive<"keep" | "hide">;
  shape: ClipShape;
};

export type OcclusionProps = {
  enabled?: SignalOrPrimitive<boolean>;
  obstacles: SignalOrPrimitive<Element | Element[] | Container | Container[]>;
  bounds?: SignalOrPrimitive<"bounds" | "hitbox">;
  padding?: SignalOrPrimitive<number>;
  alpha?: SignalOrPrimitive<number>;
  zIndex?: SignalOrPrimitive<number>;
};

export class Outline extends Directive {
  private elementRef: Element<Container> | null = null;
  private filter: OutlineFilter | null = null;
  private updateEffect: ReturnType<typeof effect> | null = null;

  onInit(element: Element<Container>) {
    this.elementRef = element;
  }

  onMount() {
    this.updateEffect = effect(() => {
      this.apply();
    });
  }

  onUpdate() {
    this.apply();
  }

  onDestroy() {
    this.removeFilter();
    this.updateEffect?.subscription.unsubscribe();
    this.updateEffect = null;
    this.elementRef = null;
  }

  private get props(): OutlineProps {
    const props = rawValueOf(this.elementRef?.props.outline);
    if (props === true) return {};
    if (props === false) return { enabled: false };
    return (props as OutlineProps | undefined) ?? {};
  }

  private apply() {
    const instance = this.elementRef?.componentInstance;
    if (!instance) return;

    const props = this.props;
    const enabled = valueOf(props.enabled, true);

    if (!enabled) {
      this.removeFilter();
      return;
    }

    if (!this.filter) {
      this.filter = new OutlineFilter({
        thickness: valueOf(props.thickness, 1),
        color: valueOf(props.color, 0xffffff),
        quality: valueOf(props.quality, 0.1),
        alpha: valueOf(props.alpha, 1),
      });
      setFilters(instance, [...getFilters(instance), this.filter]);
    }

    this.filter.thickness = valueOf(props.thickness, 1);
    this.filter.color = valueOf(props.color, 0xffffff);
    this.filter.quality = valueOf(props.quality, 0.1);
    this.filter.alpha = valueOf(props.alpha, 1);
  }

  private removeFilter() {
    const instance = this.elementRef?.componentInstance;
    if (!instance || !this.filter) return;
    setFilters(instance, getFilters(instance).filter((filter) => filter !== this.filter));
    this.filter = null;
  }
}

export class Clip extends Directive {
  private elementRef: Element<Container> | null = null;
  private maskGraphics: Graphics | null = null;
  private previousMask: any = null;
  private tickSubscription: Subscription | null = null;
  private updateEffect: ReturnType<typeof effect> | null = null;

  onInit(element: Element<Container>) {
    this.elementRef = element;
  }

  onMount(element: Element<Container>) {
    this.tickSubscription = element.props.context?.tick?.observable?.subscribe(() => {
      this.apply();
    }) ?? null;
    this.updateEffect = effect(() => {
      this.apply();
    });
  }

  onUpdate() {
    this.apply();
  }

  onDestroy() {
    const instance = this.elementRef?.componentInstance as any;
    if (instance && this.maskGraphics) {
      clearMask(instance, this.previousMask);
    }
    if (this.maskGraphics?.parent) {
      this.maskGraphics.parent.removeChild(this.maskGraphics);
    }
    this.maskGraphics?.destroy();
    this.maskGraphics = null;
    this.previousMask = null;
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;
    this.updateEffect?.subscription.unsubscribe();
    this.updateEffect = null;
    this.elementRef = null;
  }

  private get props(): ClipProps | null {
    return (rawValueOf(this.elementRef?.props.clip) as ClipProps | undefined) ?? null;
  }

  private apply() {
    const instance = this.elementRef?.componentInstance as any;
    const props = this.props;
    if (!instance || !instance.parent || !props?.shape) return;

    if (!valueOf(props.enabled, true)) {
      if (this.maskGraphics) {
        clearMask(instance, this.previousMask);
        this.maskGraphics.clear();
      }
      return;
    }

    if (!this.maskGraphics) {
      this.maskGraphics = new Graphics();
      this.previousMask = instance.mask ?? null;
    }

    addMaskToParent(instance, this.maskGraphics);
    this.maskGraphics.clear();

    const shape = props.shape;
    if (shape.type === "rect") {
      const rect = new Rectangle(
        valueOf(shape.x, 0),
        valueOf(shape.y, 0),
        valueOf(shape.width, 0),
        valueOf(shape.height, 0)
      );
      drawDisplayRect(this.maskGraphics, instance, rect);
    }

    const inverse = valueOf(props.mode, "keep") === "hide";
    setMask(instance, this.maskGraphics, inverse);
  }
}

export class Occlusion extends Directive {
  private elementRef: Element<Container> | null = null;
  private maskGraphics: Graphics | null = null;
  private ghostSprite: PixiSprite | null = null;
  private tickSubscription: Subscription | null = null;
  private updateEffect: ReturnType<typeof effect> | null = null;

  onInit(element: Element<Container>) {
    this.elementRef = element;
  }

  onMount(element: Element<Container>) {
    this.tickSubscription = element.props.context?.tick?.observable?.subscribe(() => {
      this.apply();
    }) ?? null;
    this.updateEffect = effect(() => {
      this.apply();
    });
  }

  onUpdate() {
    this.apply();
  }

  onDestroy() {
    clearMask(this.ghostSprite, null);
    if (this.ghostSprite?.parent) {
      this.ghostSprite.parent.removeChild(this.ghostSprite);
    }
    this.ghostSprite?.destroy();
    if (this.maskGraphics?.parent) {
      this.maskGraphics.parent.removeChild(this.maskGraphics);
    }
    this.maskGraphics?.destroy();
    this.maskGraphics = null;
    this.ghostSprite = null;
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;
    this.updateEffect?.subscription.unsubscribe();
    this.updateEffect = null;
    this.elementRef = null;
  }

  private get props(): OcclusionProps | null {
    return (rawValueOf(this.elementRef?.props.occlusion) as OcclusionProps | undefined) ?? null;
  }

  private apply() {
    const instance = this.elementRef?.componentInstance as any;
    const props = this.props;
    if (!instance || !props) return;

    if (!valueOf(props.enabled, true)) {
      if (this.maskGraphics) {
        this.maskGraphics.clear();
      }
      if (this.ghostSprite) {
        this.ghostSprite.visible = false;
      }
      return;
    }

    if (!this.maskGraphics || !this.ghostSprite) {
      if (!instance.texture) return;
      this.maskGraphics = new Graphics();
      this.ghostSprite = new PixiSprite(instance.texture);
    }

    addMaskToParent(instance, this.maskGraphics);
    if (this.ghostSprite.parent !== instance.parent) {
      if (this.ghostSprite.parent) {
        this.ghostSprite.parent.removeChild(this.ghostSprite);
      }
      instance.parent?.addChild(this.ghostSprite);
    }

    this.maskGraphics.clear();
    this.ghostSprite.texture = instance.texture;
    this.ghostSprite.width = instance.width;
    this.ghostSprite.height = instance.height;
    this.ghostSprite.visible = false;
    this.ghostSprite.alpha = valueOf(props.alpha, 0.35);
    copyTransform(this.ghostSprite, instance);
    if (instance.anchor && this.ghostSprite.anchor) {
      this.ghostSprite.anchor.copyFrom(instance.anchor);
    }

    const boundsMode = valueOf(props.bounds, "bounds");
    const padding = valueOf(props.padding, 0);
    const targetBounds = getWorldBounds(instance, boundsMode);
    let hasIntersection = false;
    let maxObstacleZIndex = instance.zIndex ?? 0;

    for (const obstacle of asArray(rawValueOf(props.obstacles) as any)) {
      const obstacleInstance = getElementInstance(obstacle);
      if (!obstacleInstance) continue;

      maxObstacleZIndex = Math.max(maxObstacleZIndex, (obstacleInstance as any).zIndex ?? 0);
      const obstacleBounds = getWorldBounds(obstacleInstance, boundsMode);
      const intersection = intersectRect(targetBounds, obstacleBounds);
      if (!intersection) continue;

      hasIntersection = true;
      const parentLocalTopLeft = instance.parent?.toLocal?.({ x: intersection.x - padding, y: intersection.y - padding })
        ?? { x: intersection.x - padding, y: intersection.y - padding };
      drawFilledRect(
        this.maskGraphics,
        new Rectangle(
          parentLocalTopLeft.x,
          parentLocalTopLeft.y,
          intersection.width + padding * 2,
          intersection.height + padding * 2
        )
      );
    }

    if (hasIntersection) {
      this.ghostSprite.visible = true;
      this.ghostSprite.zIndex = valueOf(props.zIndex, maxObstacleZIndex + 1);
      setMask(this.ghostSprite, this.maskGraphics, false);
    } else {
      this.ghostSprite.visible = false;
      clearMask(this.ghostSprite, null);
    }
  }
}

registerDirective("outline", Outline);
registerDirective("clip", Clip);
registerDirective("occlusion", Occlusion);
