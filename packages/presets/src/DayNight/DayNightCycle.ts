import { Filter } from "pixi.js";
import { Container, h, mount, tick, useProps } from "canvasengine";
import vertexShader from "../shaders/defaultFilter.vert.glsl?raw";
import {
  DEFAULT_DAY_CYCLE,
  lightLevel,
  sampleDayLighting,
  type DayLightingKey,
  type DayNightLight,
} from "./lighting";

export const MAX_DAY_NIGHT_LIGHTS = 64;

const fragmentShader = /* glsl */ `
  precision highp float;
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform highp vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uLights[${MAX_DAY_NIGHT_LIGHTS}];      // x, y, radius (screen px), level
  uniform vec4 uLightColors[${MAX_DAY_NIGHT_LIGHTS}]; // r, g, b, halo strength
  uniform float uLightHalo[${MAX_DAY_NIGHT_LIGHTS}];  // halo radius (screen px)
  uniform float uLightCount;
  uniform vec3 uAmbient;
  uniform float uSaturation;
  uniform float uVignette;

  void main() {
    vec4 source = texture(uTexture, vTextureCoord);
    vec3 albedo = source.rgb;
    vec2 fragPx = vTextureCoord * uInputSize.xy;

    // Time-of-day grading: desaturate, then tint and darken with the ambient light.
    float luma = dot(albedo, vec3(0.299, 0.587, 0.114));
    vec3 graded = mix(vec3(luma), albedo, uSaturation) * uAmbient;

    vec3 received = vec3(0.0);
    vec3 glow = vec3(0.0);
    for (int i = 0; i < ${MAX_DAY_NIGHT_LIGHTS}; i++) {
      if (float(i) >= uLightCount) break;
      vec4 light = uLights[i];
      if (light.w <= 0.001) continue;
      vec4 color = uLightColors[i];
      float distancePx = length(fragPx - light.xy);

      // Light pool on the ground: reveals the real colors, tinted by the lamp.
      float falloff = clamp(1.0 - distancePx / max(light.z, 1.0), 0.0, 1.0);
      received += color.rgb * falloff * falloff * light.w;

      // Glow in the air around the source (bloom-like halo).
      float haloRadius = max(uLightHalo[i], 1.0);
      float core = exp(-(distancePx * distancePx) / (haloRadius * haloRadius));
      float bloom = exp(-distancePx / (haloRadius * 2.2)) * 0.28;
      glow += color.rgb * color.a * light.w * (core + bloom);
    }

    vec3 lit = albedo * received * 1.3;
    vec3 result = graded + lit + glow * 0.75;

    vec2 uv = fragPx / max(uOutputFrame.zw, vec2(1.0));
    float edge = length((uv - 0.5) * vec2(1.15, 1.0));
    result *= 1.0 - uVignette * smoothstep(0.32, 0.85, edge);

    // Soft shoulder so bright lamps do not clip harshly.
    result = mix(result, vec3(1.0) - exp(-result * 1.35), 0.35);

    finalColor = vec4(result * source.a, source.a);
  }
`;

type ReactiveValue<T> = T | (() => T);
type BoundsLike = { x: number; y: number; width: number; height: number };

export interface DayNightCycleProps {
  /** Hour of the day, `0` to `24`. Pass a game clock `time` signal. */
  time: ReactiveValue<number>;
  /** Street lamps, windows, torches... in world coordinates. */
  lights?: ReactiveValue<DayNightLight[]>;
  /** Custom grading keyframes. Default: `DEFAULT_DAY_CYCLE`. */
  cycle?: ReactiveValue<DayLightingKey[]>;
  /** Multiplies every light intensity. Default: `1` */
  lightIntensity?: ReactiveValue<number>;
  /** Multiplies the vignette. Default: `1` */
  vignette?: ReactiveValue<number>;
}

const read = <T>(value: ReactiveValue<T> | undefined): T | undefined =>
  typeof value === "function" ? (value as () => T)() : value;

const toRgb = (value: string | number | undefined, fallback: [number, number, number]) => {
  if (value === undefined) return fallback;
  const numeric = typeof value === "number" ? value : parseInt(String(value).replace("#", ""), 16);
  if (!Number.isFinite(numeric)) return fallback;
  return [((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255] as [number, number, number];
};

const WARM_LAMP: [number, number, number] = [1, 0.706, 0.353];

/**
 * Full day/night lighting driven by an in-game hour.
 *
 * Unlike a darkness overlay, the scene is color graded by time of day (blue moonlight,
 * golden hour...), lights reveal the real colors under them with their own tint, and glow in the air.
 * Lamps fade in one by one at dusk, and windows follow their own schedule.
 *
 * Attaches a filter to the `Viewport` when present, otherwise to the parent container.
 *
 * @example
 * ```html
 * <Viewport worldWidth={1920} worldHeight={1440}>
 *   <Sprite image="town.png" />
 *   <DayNightCycle time={clock.time} lights={lights} />
 * </Viewport>
 *
 * <script>
 *   const clock = useGameClock({ time: 18, speed: 20 })
 *   const lights = [
 *     { x: 875, y: 61, radius: 190, flicker: 0.3 },
 *     { x: 169, y: 306, radius: 70, color: '#ffcf7a', halo: 0.3, schedule: [19, 23.5] },
 *   ]
 * </script>
 * ```
 */
export function DayNightCycle(options: DayNightCycleProps) {
  const props = useProps(options);
  const lightsData = new Float32Array(MAX_DAY_NIGHT_LIGHTS * 4);
  const colorsData = new Float32Array(MAX_DAY_NIGHT_LIGHTS * 4);
  const haloData = new Float32Array(MAX_DAY_NIGHT_LIGHTS);
  let filter: Filter | undefined;
  let uniforms: any;
  let viewport: any;
  let target: any;

  mount((element) => {
    const context = element.props.context;
    viewport = context?.viewport;
    target = viewport ?? element.parent?.componentInstance;
    if (!target) return;

    filter = Filter.from({
      gl: { vertex: vertexShader, fragment: fragmentShader },
      resources: {
        dayNightUniforms: {
          uLights: { value: lightsData, type: "vec4<f32>", size: MAX_DAY_NIGHT_LIGHTS },
          uLightColors: { value: colorsData, type: "vec4<f32>", size: MAX_DAY_NIGHT_LIGHTS },
          uLightHalo: { value: haloData, type: "f32", size: MAX_DAY_NIGHT_LIGHTS },
          uLightCount: { value: 0, type: "f32" },
          uAmbient: { value: new Float32Array([1, 1, 1]), type: "vec3<f32>" },
          uSaturation: { value: 1, type: "f32" },
          uVignette: { value: 0, type: "f32" },
        },
      },
    });
    uniforms = (filter as any).resources.dayNightUniforms.uniforms;
    const current = Array.isArray(target.filters) ? target.filters : [];
    target.filters = [...current, filter];

    return () => {
      const filters = Array.isArray(target.filters) ? target.filters : [];
      const next = filters.filter((item: unknown) => item !== filter);
      target.filters = next.length ? next : null;
    };
  });

  const visibleOrigin = (): { bounds: BoundsLike | null; originX: number; originY: number; zoom: number } => {
    const bounds: BoundsLike | null = viewport?.getVisibleBounds?.() ?? null;
    if (!bounds || !viewport?.toScreen) return { bounds, originX: 0, originY: 0, zoom: 1 };
    const origin = viewport.toScreen(bounds.x, bounds.y);
    return { bounds, originX: origin.x, originY: origin.y, zoom: viewport.scale?.x ?? 1 };
  };

  tick(() => {
    if (!uniforms) return;
    const hour = Number(read(props.time)) || 0;
    const lighting = sampleDayLighting(hour, read(props.cycle) ?? DEFAULT_DAY_CYCLE);
    const intensityScale = read(props.lightIntensity) ?? 1;
    const realTime = performance.now() / 1000;

    uniforms.uAmbient[0] = lighting.ambient[0];
    uniforms.uAmbient[1] = lighting.ambient[1];
    uniforms.uAmbient[2] = lighting.ambient[2];
    uniforms.uSaturation = lighting.saturation;
    uniforms.uVignette = lighting.vignette * (read(props.vignette) ?? 1);

    const lights = read(props.lights) ?? [];
    const count = Math.min(lights.length, MAX_DAY_NIGHT_LIGHTS);
    const { bounds, originX, originY, zoom } = visibleOrigin();
    lightsData.fill(0);

    for (let i = 0; i < count; i++) {
      const light = lights[i];
      const level = lightLevel(light, i, hour, lighting.lights, realTime);
      const worldX = Number(read(light.x)) || 0;
      const worldY = Number(read(light.y)) || 0;
      let x = worldX;
      let y = worldY;
      if (bounds && viewport?.toScreen) {
        const point = viewport.toScreen(worldX, worldY);
        x = point.x - originX;
        y = point.y - originY;
      }
      const radius = (light.radius ?? 160) * zoom;
      const base = i * 4;
      lightsData[base] = x;
      lightsData[base + 1] = y;
      lightsData[base + 2] = radius;
      lightsData[base + 3] = level * (light.intensity ?? 1) * intensityScale;
      const [r, g, b] = toRgb(light.color, WARM_LAMP);
      colorsData[base] = r;
      colorsData[base + 1] = g;
      colorsData[base + 2] = b;
      colorsData[base + 3] = light.halo ?? 0.6;
      haloData[i] = radius * (light.haloSize ?? 0.22);
    }

    uniforms.uLights = lightsData;
    uniforms.uLightColors = colorsData;
    uniforms.uLightHalo = haloData;
    uniforms.uLightCount = count;
  });

  return h(Container);
}
