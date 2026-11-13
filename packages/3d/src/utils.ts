import { isSignal } from "canvasengine";

export type Vec3Input = [number, number, number] | { x?: number; y?: number; z?: number } | number;

/** Reads a signal or returns the raw value. */
export function resolve<T>(value: T | (() => T)): T {
  return isSignal(value as any) ? (value as any)() : (value as T);
}

/**
 * Normalizes `[x, y, z]`, `{ x, y, z }` or a single number into `{ x, y, z }`.
 * Missing axes fall back to `fallback`.
 */
export function toVec3(value: Vec3Input | undefined, fallback = 0): { x: number; y: number; z: number } | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return { x: value, y: value, z: value };
  if (Array.isArray(value)) {
    return { x: value[0] ?? fallback, y: value[1] ?? fallback, z: value[2] ?? fallback };
  }
  return { x: value.x ?? fallback, y: value.y ?? fallback, z: value.z ?? fallback };
}

/** Same as `toVec3`, but merges a partial `{ x }` update into the current value. */
export function mergeVec3(
  current: { x: number; y: number; z: number },
  value: Vec3Input | undefined,
): { x: number; y: number; z: number } | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" || Array.isArray(value)) return toVec3(value);
  return { x: value.x ?? current.x, y: value.y ?? current.y, z: value.z ?? current.z };
}

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value) && (value as any).constructor === Object;

/**
 * Merges a partial update into nested props. The engine sends a signal nested in an
 * object prop (`material={{ baseColor: color }}`) as `{ material: { baseColor } }` only.
 */
export function deepMerge<T extends Record<string, any>>(target: T, patch: Record<string, any>): T {
  const out: Record<string, any> = { ...target };
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMerge(out[key], value) : value;
  }
  return out as T;
}

export { isPlainObject };
