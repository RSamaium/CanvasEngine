import type {
  FxColor,
  FxColorRange,
  FxCurve,
  FxCustomization,
  FxEmitterConfig,
  FxPreset,
  FxRange,
} from "./types";
import { colorToNumber, hslToRgb, rgbToHsl } from "./utils";

const CUSTOMIZATION_KEYS: (keyof FxCustomization)[] = [
  "color",
  "hueShift",
  "intensity",
  "speedScale",
  "sizeScale",
  "lifetimeScale",
];

export function hasFxCustomization(options: FxCustomization = {}) {
  return CUSTOMIZATION_KEYS.some((key) => options[key] !== undefined && options[key] !== null);
}

export function pickFxCustomization(source: Record<string, any> = {}): FxCustomization {
  const result: FxCustomization = {};
  for (const key of CUSTOMIZATION_KEYS) {
    const value = typeof source[key] === "function" ? source[key]() : source[key];
    if (value !== undefined && value !== null) (result as any)[key] = value;
  }
  return result;
}

/**
 * Returns a copy of `preset` adapted to a new color, strength, speed, size or duration.
 * The source preset is never mutated.
 *
 * @example
 * ```ts
 * // Green, bigger and denser version of the fire spell
 * const acidBall = customizeFx(FX_PRESETS.fireball, { color: '#6dff4a', intensity: 1.5, sizeScale: 1.3 })
 * ```
 */
export function customizeFx(preset: FxPreset, options: FxCustomization = {}): FxPreset {
  if (!hasFxCustomization(options)) return preset;
  const target = options.color !== undefined ? rgbToHsl(colorToNumber(options.color)) : undefined;
  const hueShift = options.hueShift ?? 0;
  const intensity = options.intensity ?? 1;
  const speedScale = options.speedScale ?? 1;
  const sizeScale = options.sizeScale ?? 1;
  const lifetimeScale = options.lifetimeScale ?? 1;

  const recolor = (value: FxColorRange | undefined): FxColorRange | undefined => {
    if (value === undefined || (!target && !hueShift)) return value;
    const map = (color: FxColor) => {
      const [h, s, l] = rgbToHsl(colorToNumber(color));
      // White cores, grey smoke and near-black shadows keep their tone.
      if (s < 0.12 || l > 0.94 || l < 0.03) return color;
      if (target) return hslToRgb(target[0] + hueShift, Math.max(target[1], s * 0.5), l);
      return hslToRgb(h + hueShift, s, l);
    };
    return Array.isArray(value) ? value.map(map) : map(value);
  };

  const emitters: FxEmitterConfig[] = preset.emitters.map((emitter) => {
    const particle = emitter.particle ?? {};
    return {
      ...emitter,
      burst: emitter.burst ? Math.max(1, Math.round(emitter.burst * intensity)) : emitter.burst,
      rate: emitter.rate ? emitter.rate * intensity : emitter.rate,
      maxParticles: emitter.maxParticles ? Math.ceil(emitter.maxParticles * intensity) : emitter.maxParticles,
      speed: scaleRange(emitter.speed, speedScale),
      gravity: emitter.gravity !== undefined ? emitter.gravity * speedScale : undefined,
      particle: {
        ...particle,
        color: recolor(particle.color),
        tint: recolor(particle.tint),
        scale: scaleCurve(particle.scale, sizeScale),
        lifetime: scaleRange(particle.lifetime, lifetimeScale),
      },
    };
  });

  return {
    ...preset,
    duration: preset.duration !== undefined ? preset.duration * lifetimeScale : undefined,
    emitters,
  };
}

function scaleRange(value: FxRange | undefined, factor: number): FxRange | undefined {
  if (value === undefined || factor === 1) return value;
  if (Array.isArray(value)) return [value[0] * factor, value[1] * factor];
  return value * factor;
}

function scaleCurve(value: FxCurve | undefined, factor: number): FxCurve | undefined {
  if (factor === 1) return value;
  if (value === undefined) return [factor, 0];
  if (Array.isArray(value)) return (value as FxRange[]).map((stop) => scaleRange(stop, factor)!);
  return value * factor;
}
