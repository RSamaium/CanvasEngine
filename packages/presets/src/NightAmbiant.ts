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
  screenWidth?: number;
  screenHeight?: number;
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

export type NightAmbiantProps = {
  lightSpots?: ReactiveValue<Array<NightSpotInput | NightSpot>>;
  spots?: ReactiveValue<Array<NightSpotInput | NightSpot>>;
};

export type NightFilter = Filter & {
  setLightWorldPosition: (position: PointLike | null) => void;
  getLightWorldPosition: () => PointLike | null;
  setSpots: (spots: NightSpot[]) => void;
  getSpots: () => NightSpot[];
  syncLightToViewport: () => void;
};

export function createNightFilter(
  viewport?: ViewportLike,
  options?: {
    lightWorldPosition?: PointLike | null;
    spots?: NightSpot[];
    getBounds?: () => BoundsLike | null | undefined;
  }
): NightFilter {
  const uSpots = new Float32Array(MAX_SPOTS * 4);
  const uSpotsUniform = { value: uSpots, type: 'vec4<f32>' as const, size: MAX_SPOTS };
  const uAspect = { value: 1, type: 'f32' as const };
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
        uAspect,
        uDarkness: { value: DARKNESS, type: 'f32' },
        uFogColor: { value: FOG_COLOR, type: 'vec3<f32>' },
        uFogRadius: { value: FOG_RADIUS, type: 'f32' },
        uFogSoftness: { value: FOG_SOFTNESS, type: 'f32' },
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
    const screenWidth = viewport?.screenWidth ?? bounds?.width ?? 0;
    const screenHeight = viewport?.screenHeight ?? bounds?.height ?? 0;
    const hasScreen = screenWidth > 0 && screenHeight > 0;
    uAspect.value = hasScreen ? screenWidth / screenHeight : 1;
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
      let radius = radiusPx <= 1 ? radiusPx : 0.15;

      if (hasScreen && viewport?.toScreen) {
        const screenPos = viewport.toScreen(spot.x, spot.y);
        x = screenPos.x / screenWidth;
        y = screenPos.y / screenHeight;
        radius = radiusPx / Math.max(screenWidth, screenHeight);
      } else if (hasBounds) {
        x = (spot.x - bounds.x) / bounds.width;
        y = (spot.y - bounds.y) / bounds.height;
        radius = radiusPx / Math.max(bounds.width, bounds.height);
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

    const nightFilter = createNightFilter(viewport, {
      spots: resolveSpots(spotsSource()),
      getBounds: () => toBoundsLike(target),
    });

    const currentFilters = Array.isArray(target.filters) ? target.filters : [];
    if (!currentFilters.includes(nightFilter)) {
      target.filters = [...currentFilters, nightFilter];
    }

    effect(() => {
      nightFilter.setSpots(resolveSpots(spotsSource()));
    });

    return () => {
      const filters = Array.isArray(target.filters) ? target.filters : [];
      const nextFilters = filters.filter((filter) => filter !== nightFilter);
      target.filters = nextFilters.length > 0 ? nextFilters : null;
    };
  });

  return h(Container);
}
