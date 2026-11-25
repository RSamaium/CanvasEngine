import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import type { Pass3D } from "@pixi/3d";
import {
  BloomEffect,
  FxaaEffect,
  MotionBlurEffect,
  OutlinePass,
  SsaoEffect,
  TiltShiftEffect,
  TintEffect,
  WireframePass,
} from "@pixi/3d/extras";
import { findViewComponent } from "./Node3D";
import { deepMerge, resolveObjectChanges } from "./utils";

/** Props shared by every effect component. */
export interface EffectProps {
  /** Turns the effect off without removing it. Default `true` */
  enabled?: boolean;
  [option: string]: any;
}

/** Whether `key` can be written on a live effect (it has a setter or is a plain field). */
function isWritable(effect: object, key: string): boolean {
  let proto: any = effect;
  while (proto && proto !== Object.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (descriptor) return !!descriptor.set || descriptor.writable === true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

/**
 * Builds the component class of a post-processing pass. It adds the pass to the
 * parent `<View3D>` on mount, writes option changes live when the pass allows it,
 * and rebuilds the pass otherwise.
 */
function effectComponent(create: (options: Record<string, any>) => Pass3D) {
  return class EffectComponent {
    fullProps: EffectProps = {};
    effect: Pass3D | null = null;
    #view: any = null;

    onInit(props: EffectProps) {
      this.fullProps = resolveObjectChanges({ ...props }, {});
    }

    onMount(element: Element<any>) {
      this.#view = findViewComponent(element);
      if (!this.#view) {
        console.warn(`<${element.tag}> must be placed inside a <View3D>`);
        return;
      }
      this.#build();
    }

    onUpdate(props: EffectProps) {
      props = resolveObjectChanges(props, this.fullProps);
      this.fullProps = deepMerge(this.fullProps, props);
      const effect = this.effect as any;
      if (!effect) return;
      const keys = Object.keys(props);
      if (keys.every((key) => key === "enabled" || isWritable(effect, key))) {
        for (const key of keys) effect[key] = props[key];
        return;
      }
      this.#build();
    }

    #build() {
      const { enabled, ...options } = this.fullProps;
      this.effect = create(options);
      if (enabled !== undefined) this.effect.enabled = enabled;
      this.#view.registerPasses(this, [this.effect], "effect");
    }

    onDestroy(_parent: Element<any>, afterDestroy?: () => void) {
      this.#view?.unregisterPasses(this);
      this.#view = null;
      this.effect = null;
      afterDestroy?.();
    }
  };
}

function defineEffect<P extends EffectProps>(tag: string, create: (options: Record<string, any>) => Pass3D) {
  registerComponent(tag, effectComponent(create));
  const component: ComponentFunction<P> = (props) => createComponent(tag, props);
  return component;
}

export interface BloomProps extends EffectProps {
  /** Brightness above which a pixel glows (default 1, in linear light) */
  threshold?: number;
  /** Strength of the glow (default 1) */
  intensity?: number;
  /** Spread of the glow */
  radius?: number;
  levels?: number;
  resolution?: number;
}
export interface SsaoProps extends EffectProps {
  radius?: number;
  intensity?: number;
  bias?: number;
  power?: number;
  maxDistance?: number;
  samples?: number;
  fadeDistance?: number;
  blurStep?: number;
  resolution?: number;
}
export interface FxaaProps extends EffectProps {
  edgeThreshold?: number;
  edgeThresholdMin?: number;
  edgeSharpness?: number;
}
export interface TiltShiftProps extends EffectProps {
  focalDepth?: number;
  focalNear?: number;
  focalFar?: number;
  maxBlur?: number;
  debug?: boolean;
}
export interface MotionBlurProps extends EffectProps {
  intensity?: number;
  samples?: number;
  maxLength?: number;
}
export interface TintProps extends EffectProps {
  tint?: number | string;
}
export interface OutlineProps extends EffectProps {
  /** Line width in world units */
  width?: number;
  color?: number | string;
}
export interface WireframeProps extends EffectProps {
  color?: number | string;
}

/** Bright parts of the frame glow outward. */
export const Bloom = defineEffect<BloomProps>("Bloom", (o) => new BloomEffect(o));
/** Screen-space ambient occlusion: darkens creases, corners and contact points. */
export const Ssao = defineEffect<SsaoProps>("Ssao", (o) => new SsaoEffect(o));
/** Smooths jagged edges; use it when the canvas has no `antialias`. */
export const Fxaa = defineEffect<FxaaProps>("Fxaa", (o) => new FxaaEffect(o));
/** Miniature look from a narrow depth of field. */
export const TiltShift = defineEffect<TiltShiftProps>("TiltShift", (o) => new TiltShiftEffect(o));
/** Blurs the image along the camera's motion. */
export const MotionBlur = defineEffect<MotionBlurProps>("MotionBlur", (o) => new MotionBlurEffect(o));
/** Multiplies the frame by a colour. */
export const Tint = defineEffect<TintProps>("Tint", (o) => new TintEffect(o));
/** Ink outline around meshes with `outlined={true}`. */
export const Outline = defineEffect<OutlineProps>("Outline", (o) => new OutlinePass(o));
/** Draws meshes with `wireframe={true}` as lines, for debugging. */
export const Wireframe = defineEffect<WireframeProps>("Wireframe", (o) => new WireframePass(o));
