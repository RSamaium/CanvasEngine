import { GlProgram } from "pixi.js";

export function createRainShader(): GlProgram {
  const vertexSrc = /* glsl */ `
    precision mediump float;
    attribute vec2 aPosition;
    attribute vec2 aUV;
    varying vec2 vUV;
    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;
    void main() {
      vUV = aUV;
      vec3 world = projectionMatrix * translationMatrix * vec3(aPosition, 1.0);
      gl_Position = vec4(world.xy, 0.0, 1.0);
    }
  `;

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

      float along = dot(uv, dir) * scale + t * speed;
      float across = dot(uv, perp) * scale;

      vec2 p = vec2(across, along);
      vec2 cell = floor(p);
      vec2 f = fract(p);

      float rnd = hash(cell);
      float rnd2 = hash(cell + 13.17);

      float x = rnd;
      float dropWidth = width * (0.7 + rnd2 * 0.6);
      float dropLength = length * (0.5 + rnd * 0.6);

      float line = smoothstep(dropWidth, 0.0, abs(f.x - x));
      float segment = smoothstep(0.0, 0.03, f.y)
        * (1.0 - smoothstep(dropLength, dropLength + 0.03, f.y));

      float visible = step(rnd, density);
      float intensity = line * segment * visible;
      return intensity * (0.6 + 0.4 * rnd2);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      float aspect = uResolution.x / uResolution.y;
      uv.x *= aspect;

      float pixelCount = uResolution.x * uResolution.y;
      float resolutionFactor = clamp(pixelCount / 700000.0, 0.6, 1.0);

      float densityFactor = clamp(uRainDensity / 240.0, 0.2, 1.2);
      float maxDropFactor = clamp(uMaxDrops / 120.0, 0.3, 1.0);
      float density = clamp(densityFactor * maxDropFactor * resolutionFactor, 0.1, 1.0);

      float slant = uWindDirection * uWindStrength * 0.6;
      float speed = 1.3 * uRainSpeed + 0.4;

      float rain = 0.0;
      rain += rainLayer(uv, uTime, 24.0, speed * 1.2, slant, density, 0.018, 0.75);
      rain += rainLayer(uv, uTime, 36.0, speed * 1.5, slant * 1.2, density * 0.8, 0.014, 0.6);
      rain += rainLayer(uv, uTime, 52.0, speed * 1.8, slant * 1.4, density * 0.6, 0.012, 0.5);

      float heightFade = mix(0.65, 1.0, uv.y);
      rain *= heightFade;

      vec3 rainColor = vec3(0.75, 0.85, 1.0);
      gl_FragColor = vec4(rainColor * rain, clamp(rain, 0.0, 0.9));
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}
