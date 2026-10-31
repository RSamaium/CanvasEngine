import type { Container, Texture } from "pixi.js";

export type FxSignal<T> = T | (() => T);
export type FxRange = number | [number, number];
/**
 * A value evolving over the particle lifetime.
 * - `0.5`: constant
 * - `[1, 0]`: from start to end (each stop can itself be a random range)
 * - `[0, 1, 0]`: evenly spaced keyframes (fade in, then out)
 */
export type FxCurve = FxRange | FxRange[];
export type FxColor = string | number;
/** A single color, or evenly spaced color stops over the particle lifetime. */
export type FxColorRange = FxColor | FxColor[];
export type FxShape =
  | "circle"
  | "softCircle"
  | "spark"
  | "square"
  | "star"
  | "ring"
  | "diamond"
  | "flare"
  | "flame"
  | "bubble"
  | "slash"
  | "streak"
  | "beam"
  | "sigil"
  | "prism";
export type FxFrameMode = "first" | "random" | "animated";
export type FxBlendMode = "normal" | "add" | "multiply" | "screen" | string;
/**
 * Initial velocity direction.
 * - `angle`: uses the emitter `angle`
 * - `outward` / `inward`: away from / toward the emitter center
 * - `tangent`: perpendicular to the center (swirl)
 * - `backward` / `forward`: against / along the heading of an emitter moving on a `path`
 *   (`angle` then becomes a spread around it, e.g. `[-15, 15]`)
 */
export type FxDirection =
  | "angle"
  | "outward"
  | "inward"
  | "tangent"
  | "backward"
  | "forward";

export interface FxParticleConfig {
  image?: string;
  texture?: Texture;
  spritesheet?: string;
  frame?: string;
  frames?: string[];
  frameMode?: FxFrameMode;
  frameRate?: number;
  shape?: FxShape;
  lifetime?: FxRange;
  color?: FxColorRange;
  tint?: FxColorRange;
  alpha?: FxCurve;
  scale?: FxCurve;
  /** Horizontal stretch over the lifetime, multiplied with `scale`. */
  scaleX?: FxCurve;
  /** Vertical stretch over the lifetime, multiplied with `scale`. */
  scaleY?: FxCurve;
  rotation?: FxRange;
  rotationSpeed?: FxRange;
  /**
   * Vertical squash applied after the rotation, so a spinning shape looks laid on the ground
   * (`0.45` for a magic circle under a character). `scaleY` would squash before rotating.
   */
  perspective?: number;
  /** Orients the particle along its movement (ideal for `spark` and `diamond`). */
  align?: "velocity";
  blendMode?: FxBlendMode;
  anchor?: { x: number; y: number };
  ease?: "linear" | "outQuad" | "outCubic" | "inQuad";
}

export type FxPathEase = "linear" | "outQuad" | "outCubic" | "inQuad";

/** A position of a moving emitter. `t` is in ms from the start of the preset (same clock as `delay`). */
export interface FxPathKey {
  t: number;
  x: number;
  y: number;
  /** Easing of the segment ending at this key. */
  ease?: FxPathEase;
}

/**
 * Starts an emitter when another named emitter reaches a point of its path
 * (an impact exactly when a projectile lands). Resolved when the preset is expanded.
 */
export interface FxTrigger {
  /** `name` of the source emitter. */
  emitter: string;
  /** `pathEnd` (default), `pathStart`, or ms after the path start. */
  at?: "pathStart" | "pathEnd" | number;
  /** Extra delay in ms after the trigger point. */
  delay?: number;
  offsetX?: number;
  offsetY?: number;
  /** Set when the trigger was renamed for a clone (instances). */
  fallback?: string;
}

/** Offset of one clone: `t` in ms, `x` / `y` in px. */
export interface FxCloneOffset {
  t?: number;
  x?: number;
  y?: number;
}

export interface FxEmitterConfig {
  name?: string;
  /**
   * Moves the emitter along keyframes. `delay` and `duration` default to the path start and length,
   * and `x` / `y` are ignored.
   */
  path?: FxPathKey[];
  trigger?: FxTrigger;
  /** Clones this emitter with a time/position offset (several meteors). A trigger aimed at it fires once per clone. */
  instances?: FxCloneOffset[];
  delay?: number;
  duration?: number;
  loop?: boolean;
  burst?: number;
  /** Number of bursts to emit (default `1`). Infinite when looping with `burstInterval`. */
  burstCount?: number;
  /** Delay between two bursts, in ms. */
  burstInterval?: number;
  rate?: number;
  maxParticles?: number;
  x?: number;
  y?: number;
  spreadX?: number;
  spreadY?: number;
  /** Spawns particles in a circle (or ring with `innerRadius`) around the emitter. */
  radius?: FxRange;
  innerRadius?: number;
  /** Vertical squash of `radius` and `orbit` (1 = circle, 0.4 = ground ellipse). */
  ellipse?: number;
  direction?: FxDirection;
  angle?: FxRange;
  speed?: FxRange;
  accelerationX?: number;
  accelerationY?: number;
  gravity?: number;
  /** Velocity damping per second (`0` = none, `3` = strong). */
  drag?: number;
  /** Rotation speed around the emitter center in degrees/s. */
  orbit?: FxRange;
  /** `world` leaves particles behind when the Fx moves (trails). */
  space?: "local" | "world";
  particle?: FxParticleConfig;
}

export type FxRecipeName = "charge" | "projectile" | "impact" | "mist" | "circle";

/**
 * A ready-made building block expanded into several emitters. Times are in ms, sizes in px.
 * `colors` is `[core, main, deep]`.
 */
export interface FxRecipeUse {
  use: FxRecipeName;
  /** Start time in ms (default `0`). */
  t?: number;
  x?: number;
  y?: number;
  scale?: number;
  density?: number;
  colors?: FxColor[];
  /** `projectile` only: keyframes of the shot (required). */
  path?: FxPathKey[];
  /** `projectile` only: name referenced by `trigger.emitter`. */
  name?: string;
  trigger?: FxTrigger;
  instances?: FxCloneOffset[];
  duration?: number;
  /** `projectile`: head shape. `mist`: cloud shape. */
  shape?: FxShape;
  /** `projectile`: shape of the trail. */
  trail?: FxShape;
  /** `impact`: lays the ring and the debris on the ground. Default `true`. */
  ground?: boolean;
  /** `mist`: rising speed in px/s. */
  rise?: number;
  /** `mist`: peak opacity. */
  opacity?: number;
  /** `circle`: radius in px. */
  radius?: number;
  /** `circle`: number of orbiting marks. */
  marks?: number;
}

/** Repeats a set of emitters (and recipes) with offsets, e.g. several meteors each with a trail and an impact. */
export interface FxEmitterGroup {
  instances: FxCloneOffset[];
  emitters: (FxEmitterConfig | FxRecipeUse)[];
}

export type FxEmitterItem = FxEmitterConfig | FxRecipeUse | FxEmitterGroup;

export interface FxPreset {
  duration?: number;
  delay?: number;
  emitters: FxEmitterItem[];
}

/** A preset whose recipes, groups, instances and triggers are resolved. */
export interface FxExpandedPreset extends Omit<FxPreset, "emitters"> {
  emitters: FxEmitterConfig[];
}

export interface FxCustomization {
  /** Recolors the preset toward this color, keeping white cores and grey smoke. */
  color?: FxColor;
  /** Rotates every color hue, in degrees. */
  hueShift?: number;
  /** Multiplies particle counts (`burst` and `rate`). */
  intensity?: number;
  /** Multiplies particle speeds. */
  speedScale?: number;
  /** Multiplies particle sizes. */
  sizeScale?: number;
  /** Multiplies particle lifetimes. */
  lifetimeScale?: number;
}

export interface FxParticle {
  sprite: any;
  age: number;
  lifetime: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  gravity: number;
  startAlpha: number;
  endAlpha: number;
  startScale: number;
  endScale: number;
  startTint: number;
  endTint: number;
  rotationSpeed: number;
  frameRate: number;
  frames: Texture[];
  ease: NonNullable<FxParticleConfig["ease"]>;
  alphaStops?: number[];
  scaleStops?: number[];
  scaleXStops?: number[];
  scaleYStops?: number[];
  tintStops?: number[];
  drag?: number;
  orbit?: number;
  centerX?: number;
  centerY?: number;
  ellipse?: number;
  align?: boolean;
  rotationOffset?: number;
  perspective?: number;
  angle?: number;
}

export interface FxInstance {
  container: Container;
  preset: FxPreset;
  elapsed: number;
  loop: boolean;
  complete: boolean;
  activeParticles: number;
  stop: () => void;
}

export interface FxRuntimeOptions {
  seed?: number;
  maxParticles?: number;
  missingTexture?: "skip" | "shape" | "error";
  /** Local offset applied to every emitter of this instance. */
  x?: number;
  y?: number;
  onStart?: (instance: FxInstance) => void;
  onComplete?: (instance: FxInstance) => void;
  onParticleSpawn?: (particle: FxParticle) => void;
}
