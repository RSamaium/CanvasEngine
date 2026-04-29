import type { FxColor, FxRange } from "./types";

export function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function createRandom(seed = Date.now()) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function rangeValue(value: FxRange | undefined, random: () => number, fallback: number): number {
  if (value === undefined) return fallback;
  if (Array.isArray(value)) {
    return value[0] + (value[1] - value[0]) * random();
  }
  return value;
}

export function normalizeAngle(value: FxRange | undefined, random: () => number): number {
  return (rangeValue(value, random, 0) * Math.PI) / 180;
}

export function colorToNumber(value: FxColor | undefined, fallback = 0xffffff): number {
  if (value === undefined) return fallback;
  if (typeof value === "number") return value;
  const hex = value.trim().replace("#", "");
  if (hex.length === 3) {
    return parseInt(hex.split("").map((char) => char + char).join(""), 16);
  }
  return parseInt(hex, 16);
}

export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function lerpColor(start: number, end: number, progress: number): number {
  const sr = (start >> 16) & 255;
  const sg = (start >> 8) & 255;
  const sb = start & 255;
  const er = (end >> 16) & 255;
  const eg = (end >> 8) & 255;
  const eb = end & 255;
  const r = Math.round(lerp(sr, er, progress));
  const g = Math.round(lerp(sg, eg, progress));
  const b = Math.round(lerp(sb, eb, progress));
  return (r << 16) + (g << 8) + b;
}

export function easeValue(name: string | undefined, progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  if (name === "outQuad") return 1 - (1 - t) * (1 - t);
  if (name === "outCubic") return 1 - Math.pow(1 - t, 3);
  if (name === "inQuad") return t * t;
  return t;
}

