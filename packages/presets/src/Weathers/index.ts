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

        // Base speed + variation
        float baseSpeed = 1.0 + rnd1 * 1.5;
        float speed = baseSpeed * uRainSpeed;

        // Y position (from 1.2 to -1.2)
        float y = 1.2 - fract(t * speed + rnd2) * 2.4;

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
 * Creates a snow shader program
 */
function createSnowShader() {
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

  // Fragment shader optimized for snow
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

    // Hash function
    float hash(float n) {
        return fract(n * 0.1031);
    }

    // A snow flake
    float snowFlake(vec2 uv, float t, float seed) {
        // Pre-generate some randoms
        float rnd0 = hash(seed);
        float rnd1 = hash(seed + 1.0);
        float rnd2 = hash(seed + 2.0);
        float rnd3 = hash(seed + 3.0);
        float rnd4 = hash(seed + 4.0);

        // Random X position with some drift
        float x = rnd0 * 2.6 - 1.3 + sin(t * 0.5 + rnd1 * 6.28) * 0.1;

        // Base speed + variation (slower than rain)
        float baseSpeed = 0.3 + rnd2 * 0.4;
        float speed = baseSpeed * uSnowSpeed;

        // Y position (from 1.3 to -1.3)
        float y = 1.3 - fract(t * speed + rnd3) * 2.6;

        // Wind effect (gentler for snow)
        float windOffset = uWindDirection * uWindStrength * (1.3 - y) * 0.3;
        x += windOffset;

        // Early discard if out of zone
        if (x < -1.5 || x > 1.5 || y < -1.5 || y > 1.5) {
            return 0.0;
        }

        vec2 flakePos = vec2(x, y);
        vec2 diff = uv - flakePos;

        // Circular flake shape with some randomness
        float size = 0.008 + rnd4 * 0.006;
        float dist = length(diff) / size;

        // Soft circular falloff
        float intensity = 1.0 - smoothstep(0.0, 1.0, dist);
        intensity *= 0.6 + 0.4 * hash(seed + 5.0);

        // Fade at edges of screen
        intensity *= smoothstep(-1.3, -0.9, y) * smoothstep(1.3, 0.9, y);

        return intensity;
    }

    void main() {
        // Normalized uv coordinates centered
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy)
                  / min(uResolution.x, uResolution.y);

        float snow = 0.0;

        // Clamp number of flakes
        float maxFlakes = clamp(uMaxFlakes, 10.0, 150.0);

        // Loop through flakes
        for (float i = 0.0; i < 150.0; i++) {
            if (i >= maxFlakes) {
                break;
            }
            snow += snowFlake(uv, uTime, i * 15.67);
        }

        // Adjustment by current density
        snow *= (uSnowDensity / maxFlakes);

        // Snow color (slightly warmer than rain)
        vec3 snowColor = vec3(0.95, 0.98, 1.0);

        gl_FragColor = vec4(snowColor * snow, snow * 0.9);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}

/**
 * Weather Effect Component (optimized)
 *
 * @param {Object} options
 * @param {string} [options.effect='rain']                  - Weather effect type ('rain', 'snow', etc.)
 * @param {number|Signal<number>} [options.speed=0.5]       - Falling speed
 * @param {number|Signal<number>} [options.windDirection=0] - Wind direction (-1 -> left, 1 -> right)
 * @param {number|Signal<number>} [options.windStrength=0.2]- Wind strength
 * @param {number|Signal<number>} [options.density=180]     - Rain density
 * @param {number|Signal<number>} [options.maxDrops=60]     - Max number of drops simulated per pixel (10–200)
 * @param {Array<number>|Signal<[number,number]>} [options.resolution=[1000,1000]]
 */
export const WeatherEffect = (options) => {
  const {
    effect = signal('rain'),
    speed = signal(0.01),
    windDirection = signal(0.0),
    windStrength = signal(0.2),
    density = signal(180.0),
    maxDrops = signal(60.0),
    resolution = signal([1000, 1000]),
  } = useProps(options);

  // Convert to signals if not already
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

  // Create appropriate shader based on effect
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
    throw new Error(`Unknown weather effect: ${effect()}. Supported effects: 'rain', 'snow'`);
  }

  // Uniform group for shader parameters
  const uniformGroup = new UniformGroup(uniformConfig);

  // Create shader with program and resources
  const shader = new Shader({
    glProgram,
    resources: {
      uniforms: uniformGroup,
    },
  });

  // Full-screen quad geometry
  const geometry = new Geometry({
    attributes: {
      aPosition: [-1, -1, 1, -1, 1, 1, -1, 1],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  // Animation loop - update time and reactive uniforms
  tick(({ deltaTime }) => {
    // Update time
    uniformGroup.uniforms.uTime = (uniformGroup.uniforms.uTime as number) + deltaTime;

    // Update common uniforms
    uniformGroup.uniforms.uResolution = resolutionSignal();
    uniformGroup.uniforms.uWindDirection = windDirectionSignal();
    uniformGroup.uniforms.uWindStrength = windStrengthSignal();

    // Update effect-specific uniforms
    if (effect === 'rain') {
      uniformGroup.uniforms.uRainSpeed = speedSignal();
      uniformGroup.uniforms.uRainDensity = densitySignal();
      uniformGroup.uniforms.uMaxDrops = maxDropsSignal();
    } else if (effect === 'snow') {
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

// Export as Weather for easier usage
export const Weather = WeatherEffect;
