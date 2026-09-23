export type RGB = [number, number, number];
type ReactiveValue<T> = T | (() => T);

/** Scene grading at a given hour. */
export interface DayLightingKey {
  hour: number;
  /** Light multiplier applied to the scene (tints and darkens it). */
  ambient: RGB;
  /** Color saturation: `1` = unchanged, `0.3` = washed-out night. */
  saturation: number;
  /** Edge darkening, `0` to `1`. */
  vignette: number;
  /** How dark it is for artificial lights: `0` = off, `1` = full night. */
  lights: number;
}

export interface DayLighting {
  ambient: RGB;
  saturation: number;
  vignette: number;
  lights: number;
}

/**
 * Default day cycle: blue moonlight at night, pink dawn, neutral day,
 * golden hour, then a purple dusk before night.
 */
export const DEFAULT_DAY_CYCLE: DayLightingKey[] = [
  { hour: 0, ambient: [0.2, 0.26, 0.46], saturation: 0.35, vignette: 0.55, lights: 1 },
  { hour: 4.5, ambient: [0.22, 0.27, 0.46], saturation: 0.38, vignette: 0.55, lights: 1 },
  { hour: 6, ambient: [0.78, 0.6, 0.62], saturation: 0.75, vignette: 0.3, lights: 0.45 },
  { hour: 7.5, ambient: [1, 0.94, 0.86], saturation: 0.95, vignette: 0.12, lights: 0 },
  { hour: 12, ambient: [1.04, 1.03, 1], saturation: 1.05, vignette: 0.08, lights: 0 },
  { hour: 16.5, ambient: [1.02, 0.96, 0.86], saturation: 1, vignette: 0.12, lights: 0 },
  { hour: 18.5, ambient: [1, 0.66, 0.44], saturation: 0.95, vignette: 0.28, lights: 0.35 },
  { hour: 19.75, ambient: [0.5, 0.42, 0.62], saturation: 0.6, vignette: 0.45, lights: 0.8 },
  { hour: 21, ambient: [0.22, 0.27, 0.48], saturation: 0.38, vignette: 0.55, lights: 1 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function sampleDayLighting(hour: number, keys: DayLightingKey[] = DEFAULT_DAY_CYCLE): DayLighting {
  const sorted = [...keys].sort((a, b) => a.hour - b.hour);
  const h = ((hour % 24) + 24) % 24;
  let previous = sorted[sorted.length - 1];
  let next = sorted[0];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].hour <= h) {
      previous = sorted[i];
      next = sorted[(i + 1) % sorted.length];
    }
  }
  if (h < sorted[0].hour) {
    previous = sorted[sorted.length - 1];
    next = sorted[0];
  }
  let span = next.hour - previous.hour;
  let offset = h - previous.hour;
  if (span <= 0) span += 24;
  if (offset < 0) offset += 24;
  const t = smooth(span === 0 ? 0 : Math.min(1, offset / span));
  return {
    ambient: [
      lerp(previous.ambient[0], next.ambient[0], t),
      lerp(previous.ambient[1], next.ambient[1], t),
      lerp(previous.ambient[2], next.ambient[2], t),
    ],
    saturation: lerp(previous.saturation, next.saturation, t),
    vignette: lerp(previous.vignette, next.vignette, t),
    lights: lerp(previous.lights, next.lights, t),
  };
}

export interface DayNightLight {
  x: ReactiveValue<number>;
  y: ReactiveValue<number>;
  /** Reach of the light on the ground, in world pixels. Default: `160` */
  radius?: number;
  /** Default: warm lamp `#ffb45a` */
  color?: string | number;
  /** Default: `1` */
  intensity?: number;
  /** Visible glow around the source (bloom), `0` to `1.5`. Default: `0.6` */
  halo?: number;
  /** Size of the glow relative to `radius`. Default: `0.22` */
  haloSize?: number;
  /** Flame-like flicker amount, `0` to `1`. Default: `0` */
  flicker?: number;
  /**
   * How dark it must be before this light switches on (`0` to `1`).
   * Staggered thresholds make street lamps light up one by one. Default: random per light.
   */
  threshold?: number;
  /** Explicit schedule in hours, e.g. `[19, 23.5]` for a window. Overrides `threshold`. */
  schedule?: [number, number];
  /** Set to `false` to switch the light off manually. */
  enabled?: ReactiveValue<boolean>;
}

const hash = (value: number) => {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const valueNoise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash(i), hash(i + 1), smooth(f));
};

function inSchedule(hour: number, [on, off]: [number, number]) {
  const fade = 0.08;
  const h = ((hour % 24) + 24) % 24;
  const distanceFrom = (from: number) => (((h - from) % 24) + 24) % 24;
  const length = (((off - on) % 24) + 24) % 24;
  const sinceOn = distanceFrom(on);
  if (sinceOn > length) return 0;
  return Math.min(1, sinceOn / fade, (length - sinceOn) / fade);
}

/**
 * How much a light is switched on (`0` to `1`) at `hour`, including the flame flicker.
 * Lights fade in and out smoothly.
 *
 * @param realTime - real time in seconds, drives the flicker
 */
export function lightLevel(
  light: DayNightLight,
  index: number,
  hour: number,
  darkness: number,
  realTime: number
): number {
  const enabled = typeof light.enabled === "function" ? light.enabled() : light.enabled;
  if (enabled === false) return 0;
  const seed = index * 7.13 + 1.7;
  let level: number;
  if (light.schedule) {
    level = inSchedule(hour, light.schedule);
  } else {
    const threshold = light.threshold ?? 0.2 + hash(seed) * 0.45;
    level = Math.max(0, Math.min(1, (darkness - threshold) / 0.12));
  }
  if (level <= 0) return 0;
  level = smooth(level);

  const flicker = light.flicker ?? 0;
  if (flicker > 0) {
    const noise = valueNoise(realTime * 9 + seed * 3) * 0.7 + valueNoise(realTime * 23 + seed) * 0.3;
    level *= 1 - flicker * 0.35 * noise;
  }
  return level;
}
