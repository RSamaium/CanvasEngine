import { isSignal } from "@signe/reactive";
import { Container } from "pixi.js";
import { Subscription } from "rxjs";
import { SignalOrPrimitive } from "../components/types";
import { Directive, registerDirective } from "../engine/directive";
import { Element } from "../engine/reactive";

export type FogVisibilityState = "visible" | "explored" | "unknown";
export type FogVisibilityMode = "visible" | "explored";
export type FogVisibilityHideAs = "visible" | "alpha";

export type FogVisibilityController = {
  version?: () => number;
  clarityAt?: (x: number, y: number) => number;
  isVisibleAt?: (x: number, y: number, threshold?: number) => boolean;
  isExploredAt?: (x: number, y: number) => boolean;
  stateAt?: (x: number, y: number, clearThreshold?: number) => FogVisibilityState | string;
};

export type FogVisibilityPoint = {
  x: SignalOrPrimitive<number>;
  y: SignalOrPrimitive<number>;
};

export type FogVisibilityProps = {
  controller?: SignalOrPrimitive<FogVisibilityController | null | undefined>;
  mode?: SignalOrPrimitive<FogVisibilityMode>;
  threshold?: SignalOrPrimitive<number>;
  point?: SignalOrPrimitive<FogVisibilityPoint>;
  hideAs?: SignalOrPrimitive<FogVisibilityHideAs>;
  hiddenAlpha?: SignalOrPrimitive<number>;
  sampleHz?: SignalOrPrimitive<number>;
};

type NormalizedFogVisibilityProps = {
  controller: FogVisibilityController | null;
  mode: FogVisibilityMode;
  threshold: number;
  hideAs: FogVisibilityHideAs;
  hiddenAlpha: number;
  sampleHz: number;
  point?: FogVisibilityPoint;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export class FogVisibility extends Directive {
  private elementRef: Element<Container> | null = null;
  private tickSubscription: Subscription | null = null;
  private sampleAccumulatorMs = 0;
  private managesAlpha = false;

  onInit(element: Element<Container>) {
    this.elementRef = element;
  }

  onMount(element: Element<Container>) {
    this.elementRef = element;
    this.evaluateVisibility();
    this.bindTick();
  }

  onUpdate() {
    this.sampleAccumulatorMs = 0;
    this.evaluateVisibility();
  }

  onDestroy() {
    const instance = this.elementRef?.componentInstance as any;
    if (instance) {
      const baseVisible = this.readBaseVisible();
      instance.visible = baseVisible;
      if (this.managesAlpha) {
        instance.alpha = this.readBaseAlpha();
      }
    }

    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;
    this.sampleAccumulatorMs = 0;
    this.managesAlpha = false;
    this.elementRef = null;
  }

  private bindTick() {
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;

    const tick = this.elementRef?.props?.context?.tick;
    if (!tick?.observable) return;

    this.tickSubscription = tick.observable.subscribe((payload: any) => {
      const tickValue = payload?.value ?? payload;
      const deltaTime = Number(tickValue?.deltaTime);
      const options = this.readOptions();
      const intervalMs = 1000 / options.sampleHz;

      this.sampleAccumulatorMs += Number.isFinite(deltaTime) ? deltaTime : intervalMs;
      if (this.sampleAccumulatorMs < intervalMs) return;

      this.sampleAccumulatorMs = 0;
      this.evaluateVisibility(options);
    });
  }

  private resolveSignalValue<T>(value: SignalOrPrimitive<T> | undefined, fallback: T): T {
    if (value === undefined || value === null) return fallback;
    if (isSignal(value as any)) {
      const signalValue = (value as any)();
      return signalValue === undefined || signalValue === null ? fallback : signalValue;
    }
    return value as T;
  }

  private readOptions(): NormalizedFogVisibilityProps {
    const fogVisibility = this.elementRef?.props?.fogVisibility;
    const raw = (fogVisibility as any)?.value ?? fogVisibility ?? {};

    const controller = this.resolveSignalValue(
      raw.controller as SignalOrPrimitive<FogVisibilityController | null | undefined>,
      null
    );
    const mode = this.resolveSignalValue(raw.mode as SignalOrPrimitive<FogVisibilityMode>, "visible");
    const threshold = clamp(
      Number(this.resolveSignalValue(raw.threshold as SignalOrPrimitive<number>, 0.65)),
      0,
      1
    );
    const hideAs = this.resolveSignalValue(
      raw.hideAs as SignalOrPrimitive<FogVisibilityHideAs>,
      "visible"
    );
    const hiddenAlpha = clamp(
      Number(this.resolveSignalValue(raw.hiddenAlpha as SignalOrPrimitive<number>, 0)),
      0,
      1
    );
    const sampleHz = clamp(
      Number(this.resolveSignalValue(raw.sampleHz as SignalOrPrimitive<number>, 30)),
      1,
      240
    );
    const point = raw.point
      ? this.resolveSignalValue(raw.point as SignalOrPrimitive<FogVisibilityPoint>, undefined as any)
      : undefined;

    return {
      controller: controller && typeof controller === "object" ? controller : null,
      mode,
      threshold,
      hideAs,
      hiddenAlpha,
      sampleHz,
      point,
    };
  }

  private readBaseVisible() {
    const visibleSource = (this.elementRef?.propObservables as any)?.visible ?? this.elementRef?.props?.visible;
    return !!this.resolveSignalValue(visibleSource as SignalOrPrimitive<boolean>, true);
  }

  private readBaseAlpha() {
    const alphaSource = (this.elementRef?.propObservables as any)?.alpha ?? this.elementRef?.props?.alpha;
    const value = Number(this.resolveSignalValue(alphaSource as SignalOrPrimitive<number>, 1));
    if (!Number.isFinite(value)) return 1;
    return clamp(value, 0, 1);
  }

  private samplePoint(options: NormalizedFogVisibilityProps) {
    if (options.point && typeof options.point === "object") {
      const x = Number(this.resolveSignalValue(options.point.x, NaN));
      const y = Number(this.resolveSignalValue(options.point.y, NaN));
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return { x, y };
      }
    }

    const instance = this.elementRef?.componentInstance as any;
    return {
      x: Number(instance?.x ?? 0),
      y: Number(instance?.y ?? 0),
    };
  }

  private resolveVisibleState(
    controller: FogVisibilityController,
    x: number,
    y: number,
    threshold: number
  ) {
    if (typeof controller.isVisibleAt === "function") {
      return !!controller.isVisibleAt(x, y, threshold);
    }
    if (typeof controller.clarityAt === "function") {
      const clarity = Number(controller.clarityAt(x, y));
      if (!Number.isFinite(clarity)) return true;
      return clarity >= threshold;
    }
    if (typeof controller.stateAt === "function") {
      const state = controller.stateAt(x, y, threshold);
      return state === "visible";
    }
    return true;
  }

  private resolveExploredState(
    controller: FogVisibilityController,
    x: number,
    y: number,
    threshold: number
  ) {
    if (typeof controller.isExploredAt === "function") {
      return !!controller.isExploredAt(x, y);
    }
    if (typeof controller.stateAt === "function") {
      const state = controller.stateAt(x, y, threshold);
      return state !== "unknown";
    }
    return this.resolveVisibleState(controller, x, y, threshold);
  }

  private evaluateVisibility(explicitOptions?: NormalizedFogVisibilityProps) {
    const element = this.elementRef;
    const instance = element?.componentInstance as any;
    if (!instance) return;

    const options = explicitOptions ?? this.readOptions();
    const baseVisible = this.readBaseVisible();
    const baseAlpha = this.readBaseAlpha();

    if (!options.controller) {
      instance.visible = baseVisible;
      if (this.managesAlpha) {
        instance.alpha = baseAlpha;
        this.managesAlpha = false;
      }
      return;
    }

    // Link directive reactivity to FogOfWar controller internal revision.
    if (typeof options.controller.version === "function") {
      options.controller.version();
    }

    const { x, y } = this.samplePoint(options);
    let fogAllowsVisibility = true;

    if (options.mode === "explored") {
      fogAllowsVisibility = this.resolveExploredState(options.controller, x, y, options.threshold);
    } else {
      fogAllowsVisibility = this.resolveVisibleState(options.controller, x, y, options.threshold);
    }

    if (options.hideAs === "alpha") {
      instance.visible = baseVisible;
      instance.alpha = fogAllowsVisibility
        ? baseAlpha
        : Math.min(baseAlpha, options.hiddenAlpha);
      this.managesAlpha = true;
      return;
    }

    instance.visible = baseVisible && fogAllowsVisibility;
    if (this.managesAlpha) {
      instance.alpha = baseAlpha;
      this.managesAlpha = false;
    }
  }
}

registerDirective("fogVisibility", FogVisibility);
