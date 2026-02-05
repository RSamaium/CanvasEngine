import { GlProgram } from "pixi.js";

/**
 * Creates a performant snow shader program.
 * Optimized with early exits, capped loop count, and LOD based on resolution.
 */
export function createSnowShader(): GlProgram {
  const vertexSrc = /* glsl */ `
    precision mediump float;
    in vec2 aPosition;
    in vec2 aUV;
    out vec2 vUV;
    uniform mat3 uProjectionMatrix;
    uniform mat3 uWorldTransformMatrix;
    uniform mat3 uTransformMatrix;
    void main(void) {
      vUV = aUV;
      mat3 modelViewProjectionMatrix = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
      gl_Position = vec4((modelViewProjectionMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    }
  `;

  const fragmentSrc = /* glsl */ `
    precision mediump float;
    in vec2 vUV;
    out vec4 finalColor;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSnowSpeed;
    uniform float uWindDirection;
    uniform float uWindStrength;
    uniform float uSnowDensity;
    uniform float uMaxFlakes;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    vec2 hash2(vec2 p) {
      return vec2(
        hash(p),
        hash(p + 19.19)
      );
    }

    float snowLayer(
      vec2 uv,
      float t,
      float scale,
      float speed,
      float wind,
      float density,
      float sizeMin,
      float sizeMax
    ) {
      vec2 p = uv;
      p.x -= wind * t;
      p.y -= t * speed;

      p *= scale;
      vec2 cell = floor(p);
      vec2 f = fract(p);

      float rnd = hash(cell);
      if (rnd > density) {
        return 0.0;
      }

      vec2 jitter = hash2(cell + 3.7);
      float wobble = (hash(cell + 9.1) - 0.5) * 0.3;
      vec2 center = jitter;
      center.x += sin(t * 0.7 + jitter.y * 6.283) * 0.15 + wobble;
      center.y += cos(t * 0.5 + jitter.x * 6.283) * 0.12;

      float size = mix(sizeMin, sizeMax, rnd);
      float dist = length(f - center);
      float alpha = 1.0 - smoothstep(size * 0.4, size, dist);
      float twinkle = 0.7 + 0.3 * sin(t * 1.2 + rnd * 6.283);
      return alpha * twinkle;
    }

    void main() {
      vec2 safeResolution = max(uResolution, vec2(1.0));
      vec2 uv = vUV;
      float aspect = safeResolution.x / safeResolution.y;
      uv.x *= aspect;

      float pixelCount = safeResolution.x * safeResolution.y;
      float resolutionFactor = clamp(pixelCount / 900000.0, 0.6, 1.1);

      float densityFactor = clamp(uSnowDensity / 180.0, 0.25, 1.3);
      float maxFlakeFactor = clamp(uMaxFlakes / 90.0, 0.4, 1.1);
      float density = clamp(densityFactor * maxFlakeFactor * resolutionFactor, 0.08, 1.0);

      float wind = uWindDirection * uWindStrength * 0.45;
      float speed = uSnowSpeed * 0.9 + 0.15;

      float snow = 0.0;
      snow += snowLayer(uv, uTime, 18.0, speed * 0.5, wind * 0.6, density, 0.1, 0.22) * 0.65;
      snow += snowLayer(uv, uTime, 28.0, speed * 0.75, wind * 0.9, density * 0.9, 0.075, 0.16) * 0.8;
      snow += snowLayer(uv, uTime, 40.0, speed, wind, density * 0.75, 0.05, 0.12);

      float heightFade = mix(0.7, 1.0, uv.y);
      snow *= heightFade;

      vec3 snowColor = vec3(0.92, 0.95, 1.0);
      float alpha = clamp(snow * 1.1, 0.0, 0.92);
      finalColor = vec4(snowColor * alpha, alpha);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}
