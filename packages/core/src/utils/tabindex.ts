import { Signal } from "@signe/reactive";

export type TabindexBoundaryMode = "wrap" | "clamp" | "none";

export type TabindexBounds =
  | { count: () => number; min?: number }
  | { min: number; max: number };

type TabindexNavigator = {
  next: (delta: number) => void;
  set: (value: number) => void;
};

function resolveBounds(bounds: TabindexBounds): { min: number; max: number; size: number } | null {
  if ("count" in bounds) {
    const count = bounds.count();
    if (!Number.isFinite(count) || count <= 0) return null;
    const min = bounds.min ?? 0;
    const max = min + count - 1;
    return { min, max, size: count };
  }

  const min = bounds.min;
  const max = bounds.max;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return { min, max, size: max - min + 1 };
}

function normalizeValue(
  value: number,
  current: number,
  bounds: { min: number; max: number; size: number },
  mode: TabindexBoundaryMode
): number {
  if (mode === "clamp") {
    return Math.min(bounds.max, Math.max(bounds.min, value));
  }

  if (mode === "none") {
    return value < bounds.min || value > bounds.max ? current : value;
  }

  // wrap
  const size = bounds.size;
  if (size <= 0) return current;
  const offset = value - bounds.min;
  const wrapped = ((offset % size) + size) % size;
  return bounds.min + wrapped;
}

export function createTabindexNavigator(
  tabindex: Signal<number>,
  bounds: TabindexBounds,
  mode: TabindexBoundaryMode = "wrap"
): TabindexNavigator {
  const applyValue = (value: number) => {
    const current = tabindex();
    const resolved = resolveBounds(bounds);
    if (!resolved) return;
    const nextValue = normalizeValue(value, current, resolved, mode);
    if (nextValue !== current) {
      tabindex.set(nextValue);
    }
  };

  return {
    next: (delta: number) => applyValue(tabindex() + delta),
    set: (value: number) => applyValue(value),
  };
}
