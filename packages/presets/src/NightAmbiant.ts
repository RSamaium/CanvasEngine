import { Filter } from "pixi.js";
import { Container, effect, h, mount, useProps } from "canvasengine";
import fragmentShader from './shaders/nightSpot.frag.glsl?raw';
import vertexShader from './shaders/defaultFilter.vert.glsl?raw';

const MAX_SPOTS = 24;
const SPOT_RADIUS_PX = 180;
/** Darkness outside the spot (0 = no darkening, 1 = black). */
const DARKNESS = 0.75;
/** Haze: distance from player (0-1) where haze starts. */
const HAZE_RADIUS = 0.5;
/** Haze: width of the haze transition (smoothstep). */
const HAZE_SOFTNESS = 0.35;
/** Haze overlay opacity when fully outside light spots. */
const HAZE_OPACITY = 0.35;
/** Haze color (RGB, linear 0-1). Dark blue-gray for night. */
const HAZE_COLOR = new Float32Array([0.08, 0.08, 0.14]);
const DARKNESS_COLOR = new Float32Array([0, 0, 0]);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const clampDarkness = (value: number) => clamp(value, 0, 1);
const clampPositive = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

type PointLike = { x: number; y: number };
type BoundsLike = { x: number; y: number; width: number; height: number };
type ScreenPointLike = { x: number; y: number };
type ReactiveValue<T> = T | (() => T);
type ViewportLike = {
  getVisibleBounds?: () => BoundsLike | null | undefined;
  toScreen?: (x: number, y: number) => ScreenPointLike;
};
type NightUniformValues = {
  uSpots: Float32Array;
  uDarknessOpacity: number;
  uDarknessColor: Float32Array;
  uHazeColor: Float32Array;
  uHazeRadius: number;
  uHazeSoftness: number;
  uHazeOpacity: number;
};
export type NightSpot = PointLike & {
  radius?: number;
  intensity?: number;
  flicker?: boolean;
  flickerSpeed?: number;
  pulse?: boolean;
  pulseSpeed?: number;
  phase?: number;
};

export type NightSpotInput = {
  x: ReactiveValue<number>;
  y: ReactiveValue<number>;
  radius?: ReactiveValue<number>;
  intensity?: ReactiveValue<number>;
  flicker?: ReactiveValue<boolean>;
  flickerSpeed?: ReactiveValue<number>;
  pulse?: ReactiveValue<boolean>;
  pulseSpeed?: ReactiveValue<number>;
  phase?: ReactiveValue<number>;
};

/**
 * Color input type supporting hex string, number, or RGB array.
 * 
 * @example
 * ```ts
 * // Hex string
 * const color1: ColorInput = "#0a1020";
 * // Number
 * const color2: ColorInput = 0x0a1020;
 * // RGB tuple (0-255)
 * const color3: ColorInput = [10, 16, 32];
 * // Normalized RGB (0-1)
 * const color4: ColorInput = [0.04, 0.06, 0.12];
 * ```
 */
export type ColorInput = string | number | [number, number, number];

export type NightDarknessOptions = {
  /** Overlay opacity outside light spots (0 = no darkening, 1 = full color overlay). Default: 0.75 */
  opacity?: ReactiveValue<number>;
  /** Overlay color outside light spots. Default: "#000000" */
  color?: ReactiveValue<ColorInput>;
};

export type NightHazeOptions = {
  /** Haze color around light spots. Default: "#141424" */
  color?: ReactiveValue<ColorInput>;
  /** Distance from light center where haze starts (0-1). Default: 0.5 */
  radius?: ReactiveValue<number>;
  /** Width of the haze transition. Default: 0.35 */
  softness?: ReactiveValue<number>;
  /** Haze overlay opacity when fully outside light spots. Default: 0.35 */
  opacity?: ReactiveValue<number>;
};

type NightHazeValues = {
  color?: ColorInput;
  radius?: number;
  softness?: number;
  opacity?: number;
};

export type NightAmbiantProps = {
  /** Main reactive list of light spots. */
  lightSpots?: ReactiveValue<Array<NightSpotInput | NightSpot>>;
  /** Alias for `lightSpots` for compatibility. */
  spots?: ReactiveValue<Array<NightSpotInput | NightSpot>>;
  /** Darkness overlay outside light spots. A number is treated as opacity for compatibility. */
  darkness?: ReactiveValue<number | NightDarknessOptions>;
  /** Tint color applied in dark zones. Legacy alias for `darkness.color`. Default: "#000000" */
  darkColor?: ReactiveValue<ColorInput>;
  /** Haze configuration. */
  haze?: ReactiveValue<NightHazeOptions>;
};

export type NightAmbientProps = NightAmbiantProps;

export type NightFilter = Filter & {
  setLightWorldPosition: (position: PointLike | null) => void;
  getLightWorldPosition: () => PointLike | null;
  setSpots: (spots: NightSpot[]) => void;
  getSpots: () => NightSpot[];
  syncLightToViewport: () => void;
  setDarknessOpacity: (value: number) => void;
  setDarkness: (value: number) => void;
  setDarknessColor: (color: ColorInput) => void;
  setDarkColor: (color: ColorInput) => void;
  setHazeColor: (color: ColorInput) => void;
  setHazeRadius: (value: number) => void;
  setHazeSoftness: (value: number) => void;
  setHazeOpacity: (value: number) => void;
};

/**
 * Parses a color input (hex string, number, or RGB array) into a normalized Float32Array [r, g, b].
 * 
 * @param color - The color input to parse
 * @returns A Float32Array with normalized RGB values (0-1)
 * 
 * @example
 * ```ts
 * parseColor("#ff0000");      // Float32Array [1, 0, 0]
 * parseColor(0x00ff00);       // Float32Array [0, 1, 0]
 * parseColor([0, 0, 255]);    // Float32Array [0, 0, 1]
 * parseColor([0.5, 0.5, 0.5]); // Float32Array [0.5, 0.5, 0.5]
 * ```
 */
const parseColor = (
  color: ColorInput,
  fallback: Float32Array = DARKNESS_COLOR
): Float32Array => {
  if (typeof color === "string") {
    // Parse hex string (#RGB, #RRGGBB)
    let hex = color.trim().replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      return new Float32Array(fallback);
    }
    const num = parseInt(hex, 16);
    return new Float32Array([
      ((num >> 16) & 0xff) / 255,
      ((num >> 8) & 0xff) / 255,
      (num & 0xff) / 255,
    ]);
  }
  if (typeof color === "number") {
    const normalized = Math.max(0, Math.floor(color)) & 0xffffff;
    return new Float32Array([
      ((normalized >> 16) & 0xff) / 255,
      ((normalized >> 8) & 0xff) / 255,
      (normalized & 0xff) / 255,
    ]);
  }
  if (Array.isArray(color) && color.length >= 3) {
    // If values are > 1, assume 0-255 range
    const isNormalized = color.every((c) => c <= 1);
    const values = isNormalized ? color : color.map((c) => c / 255);
    return new Float32Array(values.map((c) => clamp(c, 0, 1)) as [number, number, number]);
  }
  return new Float32Array(fallback);
};

/**
 * Creates a night filter with configurable light spots, darkness, and haze effects.
 * 
 * The filter renders a dark overlay with circular light spots that illuminate areas.
 * It supports multiple spots with individual intensity, radius, flicker, and pulse effects.
 * 
 * @param viewport - Optional viewport for world-to-screen coordinate conversion
 * @param options - Configuration options for the filter
 * @returns A NightFilter instance with methods to control the effect
 * 
 * @example
 * ```ts
 * const filter = createNightFilter(viewport, {
 *   spots: [{ x: 100, y: 100, radius: 200, intensity: 1.0 }],
 *   darknessOpacity: 0.8,
 *   darknessColor: "#0a1020",
 *   haze: { color: "#141a2a", opacity: 0.35 },
 * });
 * container.filters = [filter];
 * ```
 */
export function createNightFilter(
  viewport?: ViewportLike,
  options?: {
    lightWorldPosition?: PointLike | null;
    spots?: NightSpot[];
    getBounds?: () => BoundsLike | null | undefined;
    darknessOpacity?: number;
    darknessColor?: ColorInput;
    darkness?: number;
    darkColor?: ColorInput;
    haze?: NightHazeValues;
  }
): NightFilter {
  const uSpots = new Float32Array(MAX_SPOTS * 4);
  const uSpotsUniform = { value: uSpots, type: 'vec4<f32>' as const, size: MAX_SPOTS };
  const uDarknessOpacity = { value: clampDarkness(options?.darknessOpacity ?? options?.darkness ?? DARKNESS), type: 'f32' as const };
  const uDarknessColor = { value: options?.darknessColor ? parseColor(options.darknessColor) : options?.darkColor ? parseColor(options.darkColor) : new Float32Array(DARKNESS_COLOR), type: 'vec3<f32>' as const };
  const uHazeColor = { value: options?.haze?.color ? parseColor(options.haze.color, HAZE_COLOR) : new Float32Array(HAZE_COLOR), type: 'vec3<f32>' as const };
  const uHazeRadius = { value: clampPositive(options?.haze?.radius ?? HAZE_RADIUS, HAZE_RADIUS), type: 'f32' as const };
  const uHazeSoftness = { value: clampPositive(options?.haze?.softness ?? HAZE_SOFTNESS, HAZE_SOFTNESS), type: 'f32' as const };
  const uHazeOpacity = { value: clampDarkness(options?.haze?.opacity ?? HAZE_OPACITY), type: 'f32' as const };
  
  let customSpots: NightSpot[] = options?.spots ? [...options.spots] : [];
  let lightWorldPosition: PointLike | null = options?.lightWorldPosition ?? null;

  const nightFilter = Filter.from({
    gl: {
      vertex: vertexShader,
      fragment: fragmentShader,
    },
    resources: {
      nightUniforms: {
        uSpots: uSpotsUniform,
        uDarknessOpacity,
        uDarknessColor,
        uHazeColor,
        uHazeRadius,
        uHazeSoftness,
        uHazeOpacity,
      },
    },
  });
  const nightUniforms = (nightFilter as any).resources.nightUniforms.uniforms as NightUniformValues;

  const nowSeconds = () => Date.now() / 1000;
  const setColorUniform = (name: "uDarknessColor" | "uHazeColor", color: Float32Array) => {
    const current = nightUniforms[name];
    if (current instanceof Float32Array && current.length >= color.length) {
      current.set(color);
    } else {
      nightUniforms[name] = color;
    }
  };

  const getActiveSpots = (): NightSpot[] => {
    if (!lightWorldPosition) return customSpots;
    return [{ x: lightWorldPosition.x, y: lightWorldPosition.y }, ...customSpots];
  };

  const syncLightToViewport = () => {
    const activeSpots = getActiveSpots();
    const spotCount = Math.min(activeSpots.length, MAX_SPOTS);
    const bounds = viewport?.getVisibleBounds?.() ?? options?.getBounds?.();
    const hasBounds = !!bounds && bounds.width > 0 && bounds.height > 0;
    const toScreen = viewport?.toScreen?.bind(viewport);
    const canUseViewportScreen = hasBounds && typeof toScreen === "function";
    let viewportOriginX = 0;
    let viewportOriginY = 0;
    if (canUseViewportScreen) {
      const origin = toScreen(bounds.x, bounds.y);
      if (isFiniteNumber(origin?.x) && isFiniteNumber(origin?.y)) {
        viewportOriginX = origin.x;
        viewportOriginY = origin.y;
      }
    }
    const time = nowSeconds();

    uSpots.fill(0);
    for (let i = 0; i < spotCount; i++) {
      const spot = activeSpots[i];
      const radiusPx = clampPositive(spot.radius ?? SPOT_RADIUS_PX, SPOT_RADIUS_PX);
      const intensityBase = clamp(spot.intensity ?? 1, 0, 2);
      const phase = spot.phase ?? i * 0.7;
      let intensity = intensityBase;

      if (spot.flicker) {
        const flickerSpeed = spot.flickerSpeed ?? 12;
        intensity *= 0.88 + 0.12 * Math.sin(time * flickerSpeed + phase);
      }
      if (spot.pulse) {
        const pulseSpeed = spot.pulseSpeed ?? 2;
        intensity *= 0.8 + 0.2 * Math.sin(time * pulseSpeed + phase);
      }

      let x = spot.x;
      let y = spot.y;
      if (canUseViewportScreen) {
        const point = toScreen!(spot.x, spot.y);
        x = point.x - viewportOriginX;
        y = point.y - viewportOriginY;
      } else if (hasBounds) {
        x = spot.x - bounds.x;
        y = spot.y - bounds.y;
      }

      const base = i * 4;
      uSpots[base] = x;
      uSpots[base + 1] = y;
      uSpots[base + 2] = radiusPx;
      uSpots[base + 3] = clamp(intensity, 0, 2);
    }

    nightUniforms.uSpots = uSpots;
  };

  const originalApply = nightFilter.apply.bind(nightFilter);
  nightFilter.apply = ((...args: any[]) => {
    // Keep the spot anchored in world space while the viewport moves/zooms.
    syncLightToViewport();
    return (originalApply as any)(...args);
  }) as typeof nightFilter.apply;

  const extendedFilter = nightFilter as NightFilter;
  extendedFilter.setLightWorldPosition = (position: PointLike | null) => {
    lightWorldPosition = position;
    syncLightToViewport();
  };
  extendedFilter.getLightWorldPosition = () => lightWorldPosition;
  extendedFilter.setSpots = (spots: NightSpot[]) => {
    customSpots = [...spots];
    syncLightToViewport();
  };
  extendedFilter.getSpots = () => getActiveSpots().map((spot) => ({ ...spot }));
  extendedFilter.syncLightToViewport = syncLightToViewport;
  extendedFilter.setDarknessOpacity = (value: number) => {
    nightUniforms.uDarknessOpacity = clampDarkness(value);
  };
  extendedFilter.setDarkness = (value: number) => {
    extendedFilter.setDarknessOpacity(value);
  };
  extendedFilter.setDarknessColor = (color: ColorInput) => {
    setColorUniform("uDarknessColor", parseColor(color));
  };
  extendedFilter.setDarkColor = (color: ColorInput) => {
    extendedFilter.setDarknessColor(color);
  };
  extendedFilter.setHazeColor = (color: ColorInput) => {
    setColorUniform("uHazeColor", parseColor(color, HAZE_COLOR));
  };
  extendedFilter.setHazeRadius = (value: number) => {
    nightUniforms.uHazeRadius = clampPositive(value, HAZE_RADIUS);
  };
  extendedFilter.setHazeSoftness = (value: number) => {
    nightUniforms.uHazeSoftness = clampPositive(value, HAZE_SOFTNESS);
  };
  extendedFilter.setHazeOpacity = (value: number) => {
    nightUniforms.uHazeOpacity = clampDarkness(value);
  };

  syncLightToViewport();

  return extendedFilter;
}

const resolveReactiveValue = <T>(value: ReactiveValue<T> | undefined): T | undefined => {
  if (typeof value === "function") return (value as () => T)();
  return value;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const resolveSpot = (spot: NightSpotInput | NightSpot): NightSpot | null => {
  const source = resolveReactiveValue(spot as ReactiveValue<NightSpotInput | NightSpot>);
  if (!source) return null;

  const x = resolveReactiveValue(source.x as ReactiveValue<number> | undefined);
  const y = resolveReactiveValue(source.y as ReactiveValue<number> | undefined);
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;

  const radius = resolveReactiveValue(source.radius as ReactiveValue<number> | undefined);
  const intensity = resolveReactiveValue(source.intensity as ReactiveValue<number> | undefined);
  const flickerSpeed = resolveReactiveValue(source.flickerSpeed as ReactiveValue<number> | undefined);
  const pulseSpeed = resolveReactiveValue(source.pulseSpeed as ReactiveValue<number> | undefined);
  const phase = resolveReactiveValue(source.phase as ReactiveValue<number> | undefined);

  return {
    x,
    y,
    radius: isFiniteNumber(radius) ? radius : undefined,
    intensity: isFiniteNumber(intensity) ? intensity : undefined,
    flicker: !!resolveReactiveValue(source.flicker as ReactiveValue<boolean> | undefined),
    flickerSpeed: isFiniteNumber(flickerSpeed) ? flickerSpeed : undefined,
    pulse: !!resolveReactiveValue(source.pulse as ReactiveValue<boolean> | undefined),
    pulseSpeed: isFiniteNumber(pulseSpeed) ? pulseSpeed : undefined,
    phase: isFiniteNumber(phase) ? phase : undefined,
  };
};

const resolveSpots = (
  spots: ReactiveValue<Array<NightSpotInput | NightSpot>> | undefined
): NightSpot[] => {
  const list = resolveReactiveValue(spots);
  if (!Array.isArray(list)) return [];
  return list.map(resolveSpot).filter((spot): spot is NightSpot => !!spot);
};

const resolveDarknessSource = (
  value: ReactiveValue<number | NightDarknessOptions> | undefined
): number | NightDarknessOptions | undefined => resolveReactiveValue(value);

const resolveDarknessOpacity = (
  value: ReactiveValue<number | NightDarknessOptions> | undefined
): number | undefined => {
  const source = resolveDarknessSource(value);
  if (isFiniteNumber(source)) return source;
  if (source && typeof source === "object") {
    const opacity = resolveReactiveValue(source.opacity);
    if (isFiniteNumber(opacity)) return opacity;
  }
  return undefined;
};

const resolveDarknessColor = (
  value: ReactiveValue<number | NightDarknessOptions> | undefined,
  legacyDarkColor: ReactiveValue<ColorInput> | undefined
): ColorInput | undefined => {
  const source = resolveDarknessSource(value);
  if (source && typeof source === "object") {
    const color = resolveReactiveValue(source.color);
    if (color !== undefined) return color;
  }
  return resolveReactiveValue(legacyDarkColor);
};

const resolveHazeSource = (
  value: ReactiveValue<NightHazeOptions> | undefined
): NightHazeOptions | undefined => resolveReactiveValue(value);

const resolveHazeColor = (
  value: ReactiveValue<NightHazeOptions> | undefined
): ColorInput | undefined => {
  const source = resolveHazeSource(value);
  return source ? resolveReactiveValue(source.color) : undefined;
};

const resolveHazeRadius = (
  value: ReactiveValue<NightHazeOptions> | undefined
): number | undefined => {
  const source = resolveHazeSource(value);
  const radius = source ? resolveReactiveValue(source.radius) : undefined;
  return isFiniteNumber(radius) ? radius : undefined;
};

const resolveHazeSoftness = (
  value: ReactiveValue<NightHazeOptions> | undefined
): number | undefined => {
  const source = resolveHazeSource(value);
  const softness = source ? resolveReactiveValue(source.softness) : undefined;
  return isFiniteNumber(softness) ? softness : undefined;
};

const resolveHazeOpacity = (
  value: ReactiveValue<NightHazeOptions> | undefined
): number | undefined => {
  const source = resolveHazeSource(value);
  const opacity = source ? resolveReactiveValue(source.opacity) : undefined;
  return isFiniteNumber(opacity) ? opacity : undefined;
};

const toBoundsLike = (target: any): BoundsLike | null => {
  if (!target) return null;
  if (typeof target.getVisibleBounds === "function") {
    const bounds = target.getVisibleBounds();
    if (bounds) return bounds;
  }
  if (typeof target.getLocalBounds === "function") {
    const bounds = target.getLocalBounds();
    if (bounds) return bounds;
  }
  if (isFiniteNumber(target.width) && isFiniteNumber(target.height)) {
    return { x: 0, y: 0, width: target.width, height: target.height };
  }
  return null;
};

/**
 * Night ambience component that adds a dark overlay with dynamic light spots.
 * 
 * This component creates a night-time atmosphere with configurable darkness,
 * haze effects, and multiple light sources. It automatically attaches to a
 * Viewport if present in context, otherwise to the parent container.
 *
 * Prefer `NightAmbient`; `NightAmbiant` is kept for backward compatibility.
 * 
 * All props are reactive and support signal/function values.
 * 
 * @param options - Configuration options for the night ambiance effect
 * 
 * @example
 * ```html
 * <Viewport worldWidth={2048} worldHeight={2048} screen>
 *   <NightAmbient
 *     spots={lightSpots}
 *     darkness={{ opacity: 0.8, color: "#0a1020" }}
 *     haze={{ color: "#141a2a", radius: 0.5, softness: 0.35, opacity: 0.35 }}
 *   />
 * </Viewport>
 * ```
 */
export function NightAmbiant(options: NightAmbiantProps = {}) {
  const props = useProps(options);
  const spotsSource = () =>
    (props.lightSpots as ReactiveValue<Array<NightSpotInput | NightSpot>> | undefined) ??
    (props.spots as ReactiveValue<Array<NightSpotInput | NightSpot>> | undefined);

  mount((element) => {
    const context = element.props.context;
    const viewport = context?.viewport as ViewportLike | undefined;
    const target: any = viewport ?? element.parent?.componentInstance;
    if (!target) return;
    const canvasSizeSignal = context?.canvasSize as (() => { width: number; height: number }) | undefined;

    const resolveFilterBounds = (): BoundsLike | null => {
      // Outside a Viewport, use the reactive canvas size to avoid stale fixed widths.
      if (!viewport && typeof canvasSizeSignal === "function") {
        const size = canvasSizeSignal();
        if (size && isFiniteNumber(size.width) && isFiniteNumber(size.height) && size.width > 0 && size.height > 0) {
          return { x: 0, y: 0, width: size.width, height: size.height };
        }
      }
      return toBoundsLike(target);
    };

    // Resolve initial values for filter options
    const initialDarknessOpacity = resolveDarknessOpacity(props.darkness as ReactiveValue<number | NightDarknessOptions> | undefined);
    const initialDarknessColor = resolveDarknessColor(
      props.darkness as ReactiveValue<number | NightDarknessOptions> | undefined,
      props.darkColor as ReactiveValue<ColorInput> | undefined
    );
    const initialHazeColor = resolveHazeColor(
      props.haze as ReactiveValue<NightHazeOptions> | undefined
    );
    const initialHazeRadius = resolveHazeRadius(
      props.haze as ReactiveValue<NightHazeOptions> | undefined
    );
    const initialHazeSoftness = resolveHazeSoftness(
      props.haze as ReactiveValue<NightHazeOptions> | undefined
    );
    const initialHazeOpacity = resolveHazeOpacity(
      props.haze as ReactiveValue<NightHazeOptions> | undefined
    );

    const nightFilter = createNightFilter(viewport, {
      spots: resolveSpots(spotsSource()),
      getBounds: resolveFilterBounds,
      darknessOpacity: isFiniteNumber(initialDarknessOpacity) ? initialDarknessOpacity : undefined,
      darknessColor: initialDarknessColor ?? undefined,
      haze: {
        color: initialHazeColor ?? undefined,
        radius: isFiniteNumber(initialHazeRadius) ? initialHazeRadius : undefined,
        softness: isFiniteNumber(initialHazeSoftness) ? initialHazeSoftness : undefined,
        opacity: isFiniteNumber(initialHazeOpacity) ? initialHazeOpacity : undefined,
      },
    });

    const currentFilters = Array.isArray(target.filters) ? target.filters : [];
    if (!currentFilters.includes(nightFilter)) {
      target.filters = [...currentFilters, nightFilter];
    }

    // Reactive effect for spots
    effect(() => {
      nightFilter.setSpots(resolveSpots(spotsSource()));
    });

    // Reactive effect for darkness opacity
    effect(() => {
      const value = resolveDarknessOpacity(props.darkness as ReactiveValue<number | NightDarknessOptions> | undefined);
      if (isFiniteNumber(value)) {
        nightFilter.setDarknessOpacity(value);
      }
    });

    // Reactive effect for darkness color
    effect(() => {
      const value = resolveDarknessColor(
        props.darkness as ReactiveValue<number | NightDarknessOptions> | undefined,
        props.darkColor as ReactiveValue<ColorInput> | undefined
      );
      if (value !== undefined) {
        nightFilter.setDarknessColor(value);
      }
    });

    // Reactive effect for haze color
    effect(() => {
      const value = resolveHazeColor(
        props.haze as ReactiveValue<NightHazeOptions> | undefined
      );
      if (value !== undefined) {
        nightFilter.setHazeColor(value);
      }
    });

    // Reactive effect for haze radius
    effect(() => {
      const value = resolveHazeRadius(
        props.haze as ReactiveValue<NightHazeOptions> | undefined
      );
      if (isFiniteNumber(value)) {
        nightFilter.setHazeRadius(value);
      }
    });

    // Reactive effect for haze softness
    effect(() => {
      const value = resolveHazeSoftness(
        props.haze as ReactiveValue<NightHazeOptions> | undefined
      );
      if (isFiniteNumber(value)) {
        nightFilter.setHazeSoftness(value);
      }
    });

    // Reactive effect for haze opacity
    effect(() => {
      const value = resolveHazeOpacity(
        props.haze as ReactiveValue<NightHazeOptions> | undefined
      );
      if (isFiniteNumber(value)) {
        nightFilter.setHazeOpacity(value);
      }
    });

    return () => {
      const filters = Array.isArray(target.filters) ? target.filters : [];
      const nextFilters = filters.filter((filter: unknown) => filter !== nightFilter);
      target.filters = nextFilters.length > 0 ? nextFilters : null;
    };
  });

  return h(Container);
}

/** Preferred spelling. `NightAmbiant` remains exported for backward compatibility. */
export const NightAmbient = NightAmbiant;
