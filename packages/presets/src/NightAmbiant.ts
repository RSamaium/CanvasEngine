import { Filter } from "pixi.js";
import { Container, effect, h, mount, useProps } from "canvasengine";
import fragmentShader from './shaders/nightSpot.frag.glsl?raw';
import vertexShader from './shaders/defaultFilter.vert.glsl?raw';

const MAX_SPOTS = 24;
const SPOT_RADIUS_PX = 180;
/** Darkness outside the spot (0 = no darkening, 1 = black). */
const DARKNESS = 0.75;
/** Fog: distance from player (0-1) where fog starts. */
const FOG_RADIUS = 0.5;
/** Fog: width of the fog transition (smoothstep). */
const FOG_SOFTNESS = 0.35;
/** Fog color (RGB, linear 0-1). Dark blue-gray for night. */
const FOG_COLOR = new Float32Array([0.08, 0.08, 0.14]);

type PointLike = { x: number; y: number };
type BoundsLike = { x: number; y: number; width: number; height: number };
type ScreenPointLike = { x: number; y: number };
type ReactiveValue<T> = T | (() => T);
type ViewportLike = {
  getVisibleBounds?: () => BoundsLike | null | undefined;
  toScreen?: (x: number, y: number) => ScreenPointLike;
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

export type NightAmbiantProps = {
  /** Main reactive list of light spots. */
  lightSpots?: ReactiveValue<Array<NightSpotInput | NightSpot>>;
  /** Alias for `lightSpots` for compatibility. */
  spots?: ReactiveValue<Array<NightSpotInput | NightSpot>>;
  /** Darkness intensity outside light spots (0 = no darkening, 1 = full black). Default: 0.75 */
  darkness?: ReactiveValue<number>;
  /** Tint color applied in dark zones. Default: "#000000" */
  darkColor?: ReactiveValue<ColorInput>;
  /** Fog color around light spots. Default: "#141424" */
  fogColor?: ReactiveValue<ColorInput>;
  /** Distance from light center where fog starts (0-1). Default: 0.5 */
  fogRadius?: ReactiveValue<number>;
  /** Width of the fog transition. Default: 0.35 */
  fogSoftness?: ReactiveValue<number>;
};

export type NightFilter = Filter & {
  setLightWorldPosition: (position: PointLike | null) => void;
  getLightWorldPosition: () => PointLike | null;
  setSpots: (spots: NightSpot[]) => void;
  getSpots: () => NightSpot[];
  syncLightToViewport: () => void;
  setDarkness: (value: number) => void;
  setDarkColor: (color: ColorInput) => void;
  setFogColor: (color: ColorInput) => void;
  setFogRadius: (value: number) => void;
  setFogSoftness: (value: number) => void;
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
const parseColor = (color: ColorInput): Float32Array => {
  if (typeof color === "string") {
    // Parse hex string (#RGB, #RRGGBB)
    let hex = color.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const num = parseInt(hex, 16);
    return new Float32Array([
      ((num >> 16) & 0xff) / 255,
      ((num >> 8) & 0xff) / 255,
      (num & 0xff) / 255,
    ]);
  }
  if (typeof color === "number") {
    return new Float32Array([
      ((color >> 16) & 0xff) / 255,
      ((color >> 8) & 0xff) / 255,
      (color & 0xff) / 255,
    ]);
  }
  if (Array.isArray(color) && color.length >= 3) {
    // If values are > 1, assume 0-255 range
    const isNormalized = color.every((c) => c <= 1);
    return new Float32Array(
      isNormalized ? color : color.map((c) => c / 255)
    );
  }
  return new Float32Array([0, 0, 0]);
};

/**
 * Creates a night filter with configurable light spots, darkness, and fog effects.
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
 *   darkness: 0.8,
 *   darkColor: "#0a1020",
 *   fogColor: "#141a2a",
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
    darkness?: number;
    darkColor?: ColorInput;
    fogColor?: ColorInput;
    fogRadius?: number;
    fogSoftness?: number;
  }
): NightFilter {
  const uSpots = new Float32Array(MAX_SPOTS * 4);
  const uSpotsUniform = { value: uSpots, type: 'vec4<f32>' as const, size: MAX_SPOTS };
  const uDarkness = { value: options?.darkness ?? DARKNESS, type: 'f32' as const };
  const uFogColor = { value: options?.fogColor ? parseColor(options.fogColor) : FOG_COLOR, type: 'vec3<f32>' as const };
  const uFogRadius = { value: options?.fogRadius ?? FOG_RADIUS, type: 'f32' as const };
  const uFogSoftness = { value: options?.fogSoftness ?? FOG_SOFTNESS, type: 'f32' as const };
  const uDarkColor = { value: options?.darkColor ? parseColor(options.darkColor) : new Float32Array([0, 0, 0]), type: 'vec3<f32>' as const };
  
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
        uDarkness,
        uDarkColor,
        uFogColor,
        uFogRadius,
        uFogSoftness,
      },
    },
  });

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const nowSeconds = () => Date.now() / 1000;

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
      const radiusPx = spot.radius ?? SPOT_RADIUS_PX;
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
      let radius = radiusPx;

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
      uSpots[base + 2] = radius;
      uSpots[base + 3] = clamp(intensity, 0, 2);
    }

    uSpotsUniform.value = uSpots;
  };

  const originalApply = nightFilter.apply.bind(nightFilter);
  nightFilter.apply = ((...args: any[]) => {
    // Keep the spot anchored in world space while the viewport moves/zooms.
    syncLightToViewport();
    return originalApply(...args);
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
  extendedFilter.setDarkness = (value: number) => {
    uDarkness.value = value;
  };
  extendedFilter.setDarkColor = (color: ColorInput) => {
    uDarkColor.value = parseColor(color);
  };
  extendedFilter.setFogColor = (color: ColorInput) => {
    uFogColor.value = parseColor(color);
  };
  extendedFilter.setFogRadius = (value: number) => {
    uFogRadius.value = value;
  };
  extendedFilter.setFogSoftness = (value: number) => {
    uFogSoftness.value = value;
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
 * Night ambiance component that adds a dark overlay with dynamic light spots.
 * 
 * This component creates a night-time atmosphere with configurable darkness,
 * fog effects, and multiple light sources. It automatically attaches to a
 * Viewport if present in context, otherwise to the parent container.
 * 
 * All props are reactive and support signal/function values.
 * 
 * @param options - Configuration options for the night ambiance effect
 * 
 * @example
 * ```html
 * <Viewport worldWidth={2048} worldHeight={2048} screen>
 *   <NightAmbiant
 *     lightSpots={lightSpots}
 *     darkness={0.8}
 *     darkColor="#0a1020"
 *     fogColor="#141a2a"
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
    const initialDarkness = resolveReactiveValue(props.darkness as ReactiveValue<number> | undefined);
    const initialDarkColor = resolveReactiveValue(props.darkColor as ReactiveValue<ColorInput> | undefined);
    const initialFogColor = resolveReactiveValue(props.fogColor as ReactiveValue<ColorInput> | undefined);
    const initialFogRadius = resolveReactiveValue(props.fogRadius as ReactiveValue<number> | undefined);
    const initialFogSoftness = resolveReactiveValue(props.fogSoftness as ReactiveValue<number> | undefined);

    const nightFilter = createNightFilter(viewport, {
      spots: resolveSpots(spotsSource()),
      getBounds: resolveFilterBounds,
      darkness: isFiniteNumber(initialDarkness) ? initialDarkness : undefined,
      darkColor: initialDarkColor ?? undefined,
      fogColor: initialFogColor ?? undefined,
      fogRadius: isFiniteNumber(initialFogRadius) ? initialFogRadius : undefined,
      fogSoftness: isFiniteNumber(initialFogSoftness) ? initialFogSoftness : undefined,
    });

    const currentFilters = Array.isArray(target.filters) ? target.filters : [];
    if (!currentFilters.includes(nightFilter)) {
      target.filters = [...currentFilters, nightFilter];
    }

    // Reactive effect for spots
    effect(() => {
      nightFilter.setSpots(resolveSpots(spotsSource()));
    });

    // Reactive effect for darkness
    effect(() => {
      const value = resolveReactiveValue(props.darkness as ReactiveValue<number> | undefined);
      if (isFiniteNumber(value)) {
        nightFilter.setDarkness(value);
      }
    });

    // Reactive effect for dark color
    effect(() => {
      const value = resolveReactiveValue(props.darkColor as ReactiveValue<ColorInput> | undefined);
      if (value !== undefined) {
        nightFilter.setDarkColor(value);
      }
    });

    // Reactive effect for fog color
    effect(() => {
      const value = resolveReactiveValue(props.fogColor as ReactiveValue<ColorInput> | undefined);
      if (value !== undefined) {
        nightFilter.setFogColor(value);
      }
    });

    // Reactive effect for fog radius
    effect(() => {
      const value = resolveReactiveValue(props.fogRadius as ReactiveValue<number> | undefined);
      if (isFiniteNumber(value)) {
        nightFilter.setFogRadius(value);
      }
    });

    // Reactive effect for fog softness
    effect(() => {
      const value = resolveReactiveValue(props.fogSoftness as ReactiveValue<number> | undefined);
      if (isFiniteNumber(value)) {
        nightFilter.setFogSoftness(value);
      }
    });

    return () => {
      const filters = Array.isArray(target.filters) ? target.filters : [];
      const nextFilters = filters.filter((filter) => filter !== nightFilter);
      target.filters = nextFilters.length > 0 ? nextFilters : null;
    };
  });

  return h(Container);
}
