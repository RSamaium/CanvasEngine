import { Filter } from "pixi.js";
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
    const bounds = viewport?.getVisibleBounds?.();
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
