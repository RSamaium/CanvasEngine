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
 */
export type FxDirection = "angle" | "outward" | "inward" | "tangent";

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

export interface FxEmitterConfig {
  name?: string;
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

export interface FxPreset {
  duration?: number;
  delay?: number;
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
