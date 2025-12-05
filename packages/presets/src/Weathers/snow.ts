import { GlProgram } from "pixi.js";

/**
 * Creates a slow & smooth snow shader program
 * 
 * Generates procedural snowflakes with circular shapes and size variation.
 * Simulates gentle physics with slower movement and subtle wind drift.
 * Optimized for performance with early exits and efficient calculations.
 * 
 * @returns {GlProgram} The compiled WebGL program for snow effect
 */
export function createSnowShader(): GlProgram {
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

    // Hash function for random number generation
    float hash(float n) {
      return fract(sin(n) * 43758.5453);
    }

    // Generate a single snowflake
    float snowFlake(vec2 uv, float t, float seed) {
      // Pre-calculate all necessary hash values once
      float rnd0 = hash(seed);
      float rnd1 = hash(seed + 1.0);
      float rnd2 = hash(seed + 2.0);
      float rnd3 = hash(seed + 3.0);
      float rnd4 = hash(seed + 4.0);
      
      // Base X position
      float x = rnd0 * 2.4 - 1.2;
      
      // Falling speed (slower than rain)
      float baseSpeed = 0.3 + rnd1 * 0.4;
      float speed = baseSpeed * uSnowSpeed;
      
      // Y position falling from top to bottom
      float y = 1.2 - fract(t * speed + rnd2) * 2.4;
      
      // Early exit if flake is too far vertically
      if (y < -1.4 || y > 1.4) {
        return 0.0;
      }
      
      // Fall progress (0 = top, 1 = bottom)
      float fallProgress = (1.2 - y) / 2.4;
      
      // Optimized oscillation - natural and subtle movement
      float oscillationPhase = t * 1.8 + seed * 6.28;
      float oscillation = sin(oscillationPhase) * 0.08 + sin(oscillationPhase * 1.4) * 0.04;
      oscillation *= (1.0 + fallProgress * 0.3);
      
      // Wind effect - more pronounced and progressive with fall
      float windOffset = uWindDirection * uWindStrength * fallProgress * 0.8;
      
      // Add horizontal drift due to wind (even at top)
      float windDrift = uWindDirection * uWindStrength * 0.2;
      
      // Final X position with wind and oscillation
      x += windOffset + windDrift + oscillation;
      
      // Early exit if flake is too far horizontally
      if (x < -1.4 || x > 1.4) {
        return 0.0;
      }
      
      vec2 diff = uv - vec2(x, y);
      
      // Fast distance check before expensive calculations
      float distSq = dot(diff, diff);
      
      // Early exit if too far (major performance boost)
      if (distSq > 0.015) {  // ~0.12 units distance
        return 0.0;
      }
      
      // Flake size (circular) - only calculate if close
      float flakeSize = 0.008 + rnd3 * 0.006;
      float sizeSq = flakeSize * flakeSize;
      
      // Additional early exit check
      if (distSq > sizeSq * 1.5) {
        return 0.0;
      }
      
      float dist = sqrt(distSq) / flakeSize;
      
      // Intensity with soft flake shape
      float intensity = 1.0 - smoothstep(0.0, 1.0, dist);
      intensity *= 0.8 + 0.2 * rnd4;
      
      // Light twinkle (reduced frequency for performance)
      float twinkle = 0.9 + 0.1 * sin(t * 6.0 + seed * 12.56);
      intensity *= twinkle;
      
      // Fade at top and bottom
      intensity *= smoothstep(-1.2, -0.8, y) * smoothstep(1.2, 0.8, y);
      
      return intensity;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
      
      float snow = 0.0;
      
      // Calculate number of flakes based on density (optimized for performance)
      // Density 50-400 corresponds to approximately 40-150 flakes (reduced for performance)
      float targetFlakes = 40.0 + (uSnowDensity - 50.0) * (110.0 / 350.0);
      float maxFlakes = clamp(max(uMaxFlakes, targetFlakes), 30.0, 120.0);
      
      // Performance optimization: reduce loop iterations based on resolution
      float pixelCount = uResolution.x * uResolution.y;
      float resolutionFactor = clamp(pixelCount / 500000.0, 0.5, 1.0);  // LOD based on resolution
      float effectiveMaxFlakes = maxFlakes * resolutionFactor;
      float loopMax = min(effectiveMaxFlakes, 120.0);
      
      // Generate flakes (limited to 120 for performance)
      for (float i = 0.0; i < 120.0; i++) {
        if (i >= loopMax) break;
        float flakeValue = snowFlake(uv, uTime, i * 15.67);
        snow += flakeValue;
        
        // Early exit if we've accumulated enough intensity (performance optimization)
        if (snow > 2.5) break;
      }
      
      // Intensity adjustment based on density (normalization)
      // Higher density means more visible flakes
      float densityFactor = clamp(uSnowDensity / 200.0, 0.3, 2.0);
      snow *= densityFactor;
      
      // White color for snow
      vec3 snowColor = vec3(1.0, 1.0, 1.0);
      
      gl_FragColor = vec4(snowColor * snow, snow * 0.9);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}

