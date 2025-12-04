import { GlProgram } from "pixi.js";

/**
 * Creates a rain shader program
 * 
 * Generates procedural raindrops using hash functions for randomness.
 * Simulates physics with gravity and wind effects on elongated streaks.
 * Optimized for performance with early exits and efficient calculations.
 * 
 * @returns {GlProgram} The compiled WebGL program for rain effect
 */
export function createRainShader(): GlProgram {
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

    // Hash function (cheap, without trigonometry)
    float hash(float n) {
        return fract(n * 0.1031);
    }

    // Generate a single rain drop
    float rainDrop(vec2 uv, float t, float seed, float cosA, float sinA) {
        // Pre-generate random values
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

        // Fall progress (0 = top, 1 = bottom)
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

