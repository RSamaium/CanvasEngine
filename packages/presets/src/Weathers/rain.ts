import { GlProgram } from "pixi.js";

export function createRainShader(): GlProgram {
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
    uniform float uRainSpeed;
    uniform float uWindDirection;
    uniform float uWindStrength;
    uniform float uRainDensity;
    uniform float uMaxDrops;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float rainLayer(
      vec2 uv,
      float t,
      float scale,
      float speed,
      float slant,
      float density,
      float width,
      float length
    ) {
      vec2 dir = normalize(vec2(slant, 1.0));
      vec2 perp = vec2(-dir.y, dir.x);

      float along = dot(uv, dir) * scale - t * speed;
      float across = dot(uv, perp) * scale;

      vec2 p = vec2(across, along);
      vec2 cell = floor(p);
      vec2 f = fract(p);

      float rnd = hash(cell);
      float rnd2 = hash(cell + 13.17);

      float x = rnd;
      float dropWidth = width * (0.7 + rnd2 * 0.6);
      float dropLength = length * (0.5 + rnd * 0.6);

      float line = 1.0 - smoothstep(0.0, dropWidth, abs(f.x - x));
      float segment = smoothstep(0.0, 0.03, f.y)
        * (1.0 - smoothstep(dropLength, dropLength + 0.03, f.y));

      float visible = step(rnd, density);
      float intensity = line * segment * visible;
      return intensity * (0.6 + 0.4 * rnd2);
    }

    void main() {
      vec2 safeResolution = max(uResolution, vec2(1.0));
      vec2 uv = vUV;
      float aspect = safeResolution.x / safeResolution.y;
      uv.x *= aspect;

      float pixelCount = safeResolution.x * safeResolution.y;
      float resolutionFactor = clamp(pixelCount / 700000.0, 0.7, 1.1);

      float densityFactor = clamp(uRainDensity / 180.0, 0.35, 1.4);
      float maxDropFactor = clamp(uMaxDrops / 90.0, 0.45, 1.1);
      float density = clamp(densityFactor * maxDropFactor * resolutionFactor, 0.15, 1.0);

      float slant = uWindDirection * uWindStrength * 0.6;
      float speed = 1.3 * uRainSpeed + 0.4;

      float rain = 0.0;
      rain += rainLayer(uv, uTime, 24.0, speed * 1.2, slant, density, 0.026, 0.9);
      rain += rainLayer(uv, uTime, 36.0, speed * 1.5, slant * 1.2, density * 0.85, 0.02, 0.72);
      rain += rainLayer(uv, uTime, 52.0, speed * 1.8, slant * 1.4, density * 0.7, 0.016, 0.58);

      float heightFade = mix(0.65, 1.0, uv.y);
      rain *= heightFade;

      vec3 rainColor = vec3(0.75, 0.85, 1.0);
      float alpha = clamp(rain * 1.15, 0.0, 0.95);
      finalColor = vec4(rainColor * alpha, alpha);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}
