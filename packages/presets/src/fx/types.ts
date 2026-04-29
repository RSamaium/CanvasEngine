import type { Container, Texture } from "pixi.js";

export type FxSignal<T> = T | (() => T);
export type FxRange = number | [number, number];
export type FxColor = string | number;
export type FxColorRange = FxColor | [FxColor, FxColor];
export type FxShape = "circle" | "softCircle" | "spark" | "square" | "star";
export type FxFrameMode = "first" | "random" | "animated";
export type FxBlendMode = "normal" | "add" | "multiply" | "screen" | string;

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
  alpha?: FxRange;
  scale?: FxRange;
  rotation?: FxRange;
  rotationSpeed?: FxRange;
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
  rate?: number;
  maxParticles?: number;
  x?: number;
  y?: number;
  spreadX?: number;
  spreadY?: number;
  angle?: FxRange;
  speed?: FxRange;
  accelerationX?: number;
  accelerationY?: number;
  gravity?: number;
  particle?: FxParticleConfig;
}

export interface FxPreset {
  duration?: number;
  delay?: number;
  emitters: FxEmitterConfig[];
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
  onStart?: (instance: FxInstance) => void;
  onComplete?: (instance: FxInstance) => void;
  onParticleSpawn?: (particle: FxParticle) => void;
}

