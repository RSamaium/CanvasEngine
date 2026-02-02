import { Filter } from "pixi.js";
import fragmentShader from './shaders/nightSpot.frag.glsl?raw';
import vertexShader from './shaders/defaultFilter.vert.glsl?raw';

/** Default radius in "normalized screen" (0-1). Used when not compensating for zoom. */
const SPOT_RADIUS_NORMALIZED = 0.25;
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
type ViewportLike = { getVisibleBounds?: () => BoundsLike | null | undefined };

export type NightFilter = Filter & {
  setLightWorldPosition: (position: PointLike | null) => void;
  getLightWorldPosition: () => PointLike | null;
  syncLightToViewport: () => void;
};

export function createNightFilter(
  viewport?: ViewportLike,
  options?: {
    lightWorldPosition?: PointLike | null;
  }
): NightFilter {
  const uLightPos = new Float32Array([0.5, 0.5]);
  let lightWorldPosition: PointLike | null = options?.lightWorldPosition ?? null;

  const nightFilter = Filter.from({
    gl: {
      vertex: vertexShader,
      fragment: fragmentShader,
    },
    resources: {
      nightUniforms: {
        uLightPos: { value: uLightPos, type: 'vec2<f32>' },
        uRadius: { value: SPOT_RADIUS_NORMALIZED, type: 'f32' },
        uDarkness: { value: DARKNESS, type: 'f32' },
        uFogColor: { value: FOG_COLOR, type: 'vec3<f32>' },
        uFogRadius: { value: FOG_RADIUS, type: 'f32' },
        uFogSoftness: { value: FOG_SOFTNESS, type: 'f32' },
      },
    },
  });

  const syncLightToViewport = () => {
    if (!lightWorldPosition || !viewport?.getVisibleBounds) return;

    const bounds = viewport.getVisibleBounds();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

    uLightPos[0] = (lightWorldPosition.x - bounds.x) / bounds.width;
    uLightPos[1] = (lightWorldPosition.y - bounds.y) / bounds.height;
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
  extendedFilter.syncLightToViewport = syncLightToViewport;

  syncLightToViewport();

  return extendedFilter;
}
