import {
  tick,
  useProps,
  h,
  Mesh,
  signal,
} from "canvasengine";
import { Geometry, Shader, GlProgram, UniformGroup } from "pixi.js";

/**
 * Creates a rain shader program
 */
function createRainShader() {
  // Vertex shader - full screen quad
  const vertexSrc = /* glsl */ `
    precision mediump float;
    attribute vec2 aPosition;
    attribute vec2 aUV;
    varying   vec2 vUV;
    void main() {
        vUV = aUV;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // Fragment shader optimized for rain
  const fragmentSrc = /* glsl */ `
    precision mediump float;

    varying vec2 vUV;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uRainSpeed;
    uniform float uWindDirection;
    uniform float uWindStrength;
    uniform float uRainDensity;
    uniform float uMaxDrops;

    // Hash cheap (without trig)
    float hash(float n) {
        return fract(n * 0.1031);
    }

    // A rain drop
    float rainDrop(vec2 uv, float t, float seed, float cosA, float sinA) {
        // Pre-generate some randoms
        float rnd0 = hash(seed);
        float rnd1 = hash(seed + 1.0);
        float rnd2 = hash(seed + 2.0);
        float rnd3 = hash(seed + 3.0);
        float rnd4 = hash(seed + 4.0);
        float rnd5 = hash(seed + 5.0);

        // Random X position
        float x = rnd0 * 2.4 - 1.2;

        // Base speed + variation (reduced for smoother falling)
        float baseSpeed = 0.3 + rnd1 * 0.4;
        float speed = baseSpeed * uRainSpeed;

        // Y position: use mod instead of fract(t*speed) to ensure proper distribution
        // rnd2 provides the initial offset (0-1), then we add time-based movement
        float yProgress = mod(rnd2 + t * speed, 1.0);
        float y = 1.2 - yProgress * 2.4;

        // Fall progress (0 top -> 1 bottom)
        float fallProgress = (1.2 - y) / 2.4;
        float windOffset = uWindDirection * uWindStrength * fallProgress * 0.5;
        x += windOffset;

        // Early discard if really out of useful zone
        if (x < -1.4 || x > 1.4 || y < -1.4 || y > 1.4) {
            return 0.0;
        }

        vec2 dropPos = vec2(x, y);
        vec2 diff = uv - dropPos;

        // Shape (thin streak)
        float dropWidth  = 0.0015 + rnd3 * 0.0005;
        float dropLength = 0.025  + rnd4 * 0.015;

        // Slight tilt (wind) pre-calculated
        vec2 rotatedDiff = vec2(
            diff.x * cosA - diff.y * sinA,
            diff.x * sinA + diff.y * cosA
        );

        float distX = abs(rotatedDiff.x) / dropWidth;
        float distY = abs(rotatedDiff.y) / dropLength;
        float dist  = max(distX, distY * 0.4);

        // Intensity "Zelda style"
        float intensity = 1.0 - smoothstep(0.0, 1.2, dist);
        intensity *= 0.7 + 0.3 * rnd5;

        // Fade at top & bottom of screen
        intensity *= smoothstep(-1.2, -0.8, y) * smoothstep(1.2, 0.8, y);

        return intensity;
    }

    void main() {
        // Normalized uv coordinates centered
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy)
                  / min(uResolution.x, uResolution.y);

        float rain = 0.0;

        // Clamp number of drops (to avoid recompiling shader)
        float maxDrops = clamp(uMaxDrops, 10.0, 200.0);

        // Wind angle & pre-calculated trig (once per fragment, not per drop)
        float windAngle = uWindDirection * uWindStrength * 0.2;
        float cosA = cos(windAngle);
        float sinA = sin(windAngle);

        // "Soft" loop: keep 200 as upper bound, but break with maxDrops
        for (float i = 0.0; i < 200.0; i++) {
            if (i >= maxDrops) {
                break;
            }
            rain += rainDrop(uv, uTime, i * 12.34, cosA, sinA);
        }

        // Adjustment by current density
        rain *= (uRainDensity / maxDrops);

        // Rain color
        vec3 rainColor = vec3(0.85, 0.9, 1.0);

        gl_FragColor = vec4(rainColor * rain, rain * 0.8);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}

/**
 * Creates a slow & smooth snow shader program
 */
function createSnowShader() {
  // Vertex shader
  const vertexSrc = /* glsl */ `
    precision mediump float;
    attribute vec2 aPosition;
    attribute vec2 aUV;
    varying   vec2 vUV;
    void main() {
      vUV = aUV;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // Fragment shader optimized for soft falling snow
  const fragmentSrc = /* glsl */ `
    precision mediump float;

    varying vec2 vUV;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSnowSpeed;
    uniform float uWindDirection;
    uniform float uWindStrength;
    uniform float uSnowDensity;
    uniform float uMaxFlakes;

    // Cheap hash (no trig)
    float hash(float n) {
      return fract(n * 0.1031);
    }

    // A snow flake
    float snowFlake(vec2 uv, float t, float seed, float aspectX) {
      float rnd0 = hash(seed);
      float rnd1 = hash(seed + 1.0);
      float rnd2 = hash(seed + 2.0);
      float rnd3 = hash(seed + 3.0);

      // Depth (0.5 near, 1.0 far)
      float depth = 0.5 + 0.5 * rnd0;
      float scale = depth;

      // Random X base
      float xBase = rnd1 * 2.4 - 1.2;

      // Very slow base speed + variation
      float baseSpeed = 0.008 + rnd2 * 0.017;

      // Depth factor (less extreme than before)
      float depthFactor = (0.5 + 0.5 * scale);

      // Final speed
      float speed = baseSpeed * uSnowSpeed * depthFactor;

      // Y position: use mod to ensure proper distribution across the screen
      // rnd3 provides initial offset, time adds movement
      float fallTime = t * speed;
      float yProgress = mod(rnd3 + fallTime, 1.0);
      float y = 1.1 - yProgress * 2.2;

      // Global wind
      float wind = uWindDirection * uWindStrength * (1.3 - y) * 0.4;

      // Very gentle sway and turbulence (low frequency for smooth motion)
      float sway = sin(fallTime * 0.3 + rnd0 * 6.283) * 0.03;
      float turb = sin((seed + t) * 0.15 + y * 2.0) * 0.02 * (1.2 - depth);

      // Final X
      float x = xBase + wind + sway + turb;

      // Early discard
      if (x < -1.4 || x > 1.4 || y < -1.4 || y > 1.4)
        return 0.0;

      vec2 flakePos = vec2(x, y);

      vec2 diff = uv - flakePos;
      diff.x *= aspectX;

      float size = (0.006 + rnd2 * 0.008) * scale;

      float dist = length(diff) / size;

      float intensity = 1.0 - smoothstep(0.0, 1.0, dist);

      intensity *= depth * depth;

      // Very subtle twinkle (slow)
      intensity *= 0.92 + 0.08 * sin(t * 0.5 + rnd3 * 6.283);

      // Fade top/bottom
      intensity *= smoothstep(-1.2, -0.9, y) * smoothstep(1.2, 0.9, y);

      return intensity;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy)
                / min(uResolution.x, uResolution.y);

      float snow = 0.0;

      float maxFlakes = clamp(uMaxFlakes, 10.0, 200.0);
      float aspectX = uResolution.x / uResolution.y;

      for (float i = 0.0; i < 200.0; i++) {
        if (i >= maxFlakes) break;
        snow += snowFlake(uv, uTime, i * 17.23, aspectX);
      }

      snow *= (uSnowDensity / 120.0);

      vec3 snowColor = vec3(0.96, 0.98, 1.0);

      gl_FragColor = vec4(snowColor * snow, snow);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}


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
    uniformGroup.uniforms.uTime = (uniformGroup.uniforms.uTime) + deltaTime;

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
