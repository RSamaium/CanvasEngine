import {
  tick,
  useProps,
  h,
  Mesh,
  signal,
} from "canvasengine";
import { Geometry, Shader, UniformGroup } from "pixi.js";
import { createRainShader } from "./rain";
import { createSnowShader } from "./snow";


/**
 * Weather Effect Component (optimized)
 */
export const WeatherEffect = (options) => {
  const {
    effect = signal('rain'),
    speed = signal(0.1),
    windDirection = signal(0.0),
    windStrength = signal(0.2),
    density = signal(180.0),
    maxDrops = signal(60.0),
    resolution = signal([1000, 1000]),
  } = useProps(options);

  const speedSignal = typeof speed === "function" ? speed : signal(speed);
  const windDirectionSignal =
    typeof windDirection === "function" ? windDirection : signal(windDirection);
  const windStrengthSignal =
    typeof windStrength === "function" ? windStrength : signal(windStrength);
  const densitySignal =
    typeof density === "function" ? density : signal(density);
  const maxDropsSignal =
    typeof maxDrops === "function" ? maxDrops : signal(maxDrops);
  const resolutionSignal =
    typeof resolution === "function" ? resolution : signal(resolution);

  let glProgram;
  let uniformConfig;

  if (effect() === 'rain') {
    glProgram = createRainShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
      uRainSpeed: { value: speedSignal(), type: "f32" },
      uWindDirection: { value: windDirectionSignal(), type: "f32" },
      uWindStrength: { value: windStrengthSignal(), type: "f32" },
      uRainDensity: { value: densitySignal(), type: "f32" },
      uMaxDrops: { value: maxDropsSignal(), type: "f32" },
    };
  } else if (effect() === 'snow') {
    glProgram = createSnowShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
      uSnowSpeed: { value: speedSignal(), type: "f32" },
      uWindDirection: { value: windDirectionSignal(), type: "f32" },
      uWindStrength: { value: windStrengthSignal(), type: "f32" },
      uSnowDensity: { value: densitySignal(), type: "f32" },
      uMaxFlakes: { value: maxDropsSignal(), type: "f32" },
    };
  } else {
    throw new Error(`Unknown weather effect: ${effect()}. Supported: rain, snow`);
  }

  const uniformGroup = new UniformGroup(uniformConfig);

  const shader = new Shader({
    glProgram,
    resources: { uniforms: uniformGroup },
  });

  const geometry = new Geometry({
    attributes: {
      aPosition: [-1, -1, 1, -1, 1, 1, -1, 1],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  tick(({ deltaTime }) => {
    uniformGroup.uniforms.uTime = (uniformGroup.uniforms.uTime as number) + deltaTime / 600;

    uniformGroup.uniforms.uResolution = resolutionSignal();
    uniformGroup.uniforms.uWindDirection = windDirectionSignal();
    uniformGroup.uniforms.uWindStrength = windStrengthSignal();

    if (effect() === 'rain') {
      uniformGroup.uniforms.uRainSpeed = speedSignal();
      uniformGroup.uniforms.uRainDensity = densitySignal();
      uniformGroup.uniforms.uMaxDrops = maxDropsSignal();
    } else {
      uniformGroup.uniforms.uSnowSpeed = speedSignal();
      uniformGroup.uniforms.uSnowDensity = densitySignal();
      uniformGroup.uniforms.uMaxFlakes = maxDropsSignal();
    }
  });

  return h(Mesh, {
    geometry,
    shader,
  });
};

export const Weather = WeatherEffect;
