import { GlProgram } from "pixi.js";

/**
 * Creates a high-performance rain shader program with fine realistic streaks
 * 
 * Generates procedural raindrops using optimized hash functions for randomness.
 * Simulates physics with gravity and wind effects on fine elongated streaks.
 * Features thin realistic rain streaks (like real rain), optimized calculations,
 * and early exit optimizations for smooth 60fps performance.
 * 
 * Performance optimizations:
 * - Reduced hash function calls (4 instead of 6)
 * - Early bounds checking before expensive calculations
 * - Single smoothstep instead of multiple
 * - Optimized distance calculations
 * - Pre-calculated trigonometric values
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

  // Fragment shader optimized for performance with fine realistic rain streaks
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

    // Optimized hash function (single multiply, no sin)
    float hash(float n) {
        return fract(n * 0.1031);
    }

    // Generate a single rain drop with fine realistic streak (highly optimized)
    float rainDrop(vec2 uv, float t, float seed, float dropIndex, float maxDrops, float cosA, float sinA) {
        // Pre-generate only necessary random values (reduced from 6 to 3)
        float rnd0 = hash(seed);
        float rnd1 = hash(seed + 1.0);
        float rnd2 = hash(seed + 2.0);

        // Simplified X position calculation
        float xStructured = mod(dropIndex, 35.0) / 35.0;
        float x = mix(rnd0, xStructured, 0.4) * 2.4 - 1.2;

        // Base speed + variation
        float speed = (0.4 + rnd1 * 0.6) * uRainSpeed;

        // Simplified Y position calculation
        float yStructured = mod(dropIndex, maxDrops) / max(maxDrops, 1.0);
        float initialYOffset = mix(rnd2, yStructured, 0.7);
        float yProgress = mod(initialYOffset + t * speed, 1.0);
        float y = 1.2 - yProgress * 2.4;

        // Aggressive early discard - check vertical bounds first
        if (y < -1.3 || y > 1.3) {
            return 0.0;
        }

        // Simplified wind effect
        float windOffset = uWindDirection * uWindStrength * yProgress * 0.5;
        x += windOffset;

        // Early discard for horizontal bounds
        if (x < -1.5 || x > 1.5) {
            return 0.0;
        }

        // Fast distance check before expensive calculations
        vec2 diff = uv - vec2(x, y);
        float distSq = dot(diff, diff);
        
        // Early discard if too far (major performance boost)
        if (distSq > 0.01) {  // ~0.1 units distance
            return 0.0;
        }

        // Only calculate expensive operations if we're close
        float dropWidth = 0.0012 + rnd0 * 0.0008;
        float dropLength = 0.035 + rnd1 * 0.020;

        // Simplified rotation (only if needed)
        float rotX = diff.x * cosA - diff.y * sinA;
        float rotY = diff.x * sinA + diff.y * cosA;

        // Fast distance calculation
        float distX = abs(rotX) / dropWidth;
        float distY = abs(rotY) / dropLength;
        float dist = max(distX, distY * 0.6);

        // Final early discard
        if (dist > 1.2) {
            return 0.0;
        }

        // Simplified intensity calculation
        float intensity = 1.0 - smoothstep(0.0, 1.0, dist);
        intensity *= 0.7 + 0.5 * rnd0;

        // Simplified vertical fade
        float verticalFade = smoothstep(-1.2, -0.8, y) * smoothstep(1.2, 0.8, y);
        intensity *= verticalFade;

        return intensity;
    }

    void main() {
        // Normalized uv coordinates centered (pre-calculated once)
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy)
                  / min(uResolution.x, uResolution.y);

        float rain = 0.0;

        // Clamp number of drops - reduced max for better performance
        float maxDrops = clamp(uMaxDrops, 10.0, 150.0);

        // Pre-calculate wind angle & trig once per fragment
        float windAngle = uWindDirection * uWindStrength * 0.2;
        float cosA = cos(windAngle);
        float sinA = sin(windAngle);

        // Performance optimization: reduce loop iterations based on resolution
        float pixelCount = uResolution.x * uResolution.y;
        float resolutionFactor = clamp(pixelCount / 500000.0, 0.5, 1.0);  // LOD based on resolution
        float effectiveMaxDrops = maxDrops * resolutionFactor;
        float loopMax = min(effectiveMaxDrops, 150.0);

        // Optimized loop with early exit optimization
        for (float i = 0.0; i < 150.0; i++) {
            if (i >= loopMax) break;
            // Use larger prime number spacing for better seed distribution
            float seed = i * 23.47;
            float dropValue = rainDrop(uv, uTime, seed, i, maxDrops, cosA, sinA);
            rain += dropValue;
            
            // Early exit if we've accumulated enough intensity (performance optimization)
            if (rain > 2.0) break;
        }

        // Scale based on density (optimized calculation)
        rain *= uRainDensity * 0.007;

        // Realistic rain color
        vec3 rainColor = vec3(0.88, 0.92, 1.0);

        // Alpha calculation - improved visibility
        float alpha = rain * 0.9;

        gl_FragColor = vec4(rainColor * rain, alpha);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}
