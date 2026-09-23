import type { FxColor, FxColorRange, FxCurve, FxRange } from "./types";

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


/**
 * Resolves a lifetime curve into numeric stops.
 * A single value gives one stop; an array gives one stop per entry.
 */
export function curveStops(value: FxCurve | undefined, random: () => number, fallback: number[]): number[] {
  if (value === undefined) return fallback;
  if (Array.isArray(value)) {
    return (value as FxRange[]).map((stop) => rangeValue(stop, random, 0));
  }
  return [value];
}

export function colorStops(value: FxColorRange | undefined, fallback = 0xffffff): number[] {
  if (value === undefined) return [fallback];
  if (Array.isArray(value)) return value.map((color) => colorToNumber(color, fallback));
  return [colorToNumber(value, fallback)];
}

function stopSegment(count: number, progress: number) {
  const position = Math.max(0, Math.min(1, progress)) * (count - 1);
  const index = Math.min(count - 2, Math.floor(position));
  return { index, local: position - index };
}

export function sampleStops(stops: number[], progress: number): number {
  if (stops.length === 1) return stops[0];
  const { index, local } = stopSegment(stops.length, progress);
  return lerp(stops[index], stops[index + 1], local);
}

export function sampleColorStops(stops: number[], progress: number): number {
  if (stops.length === 1) return stops[0];
  const { index, local } = stopSegment(stops.length, progress);
  return lerpColor(stops[index], stops[index + 1], local);
}

export function rgbToHsl(color: number): [number, number, number] {
  const r = ((color >> 16) & 255) / 255;
  const g = ((color >> 8) & 255) / 255;
  const b = (color & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): number {
  const hue = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return (v << 16) + (v << 8) + v;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(channel(hue + 1 / 3) * 255);
  const g = Math.round(channel(hue) * 255);
  const b = Math.round(channel(hue - 1 / 3) * 255);
  return (r << 16) + (g << 8) + b;
}
