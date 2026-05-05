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
    uniform float uRainTopDown;

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
      float minLength,
      float maxLength,
      float brightness
    ) {
      vec2 dir = normalize(vec2(slant * 0.45, 1.0));
      vec2 perp = vec2(-dir.y, dir.x);

      vec2 flow = vec2(dot(uv, perp), dot(uv, dir));
      flow.y -= t * speed;

      vec2 p = flow * scale;
      vec2 baseCell = floor(p);
      vec2 local = p - baseCell;
      float rain = 0.0;

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(float(x), float(y));
          vec2 cell = baseCell + offset;
          float rnd = hash(cell);
          float rnd2 = hash(cell + 13.17);
          float rnd3 = hash(cell + 47.31);
          float rnd4 = hash(cell + 91.73);

          vec2 center = offset + vec2(rnd2, rnd3);
          vec2 delta = local - center;
          delta.x += delta.y * (rnd4 - 0.5) * 0.12;

          float dropWidth = width * (0.7 + rnd2 * 0.45);
          float dropLength = mix(minLength, maxLength, rnd4);
          float halfLength = dropLength * 0.5;
          float capFade = min(0.06, halfLength * 0.5);

          float line = 1.0 - smoothstep(dropWidth, dropWidth + 0.018, abs(delta.x));
          float segment = smoothstep(-halfLength, -halfLength + capFade, delta.y)
            * (1.0 - smoothstep(halfLength - capFade, halfLength, delta.y));
          float taper = 0.45 + 0.55 * (1.0 - smoothstep(0.0, halfLength, abs(delta.y)));
          float head = 1.0 - smoothstep(
            dropWidth * 0.8,
            dropWidth * 2.4,
            length(vec2(delta.x * 1.3, (delta.y - halfLength * 0.35) * 0.7))
          );

          float visible = step(rnd, density);
          rain += (line * segment * taper + head * 0.06) * visible * (0.55 + 0.45 * rnd3);
        }
      }

      return clamp(rain * brightness, 0.0, 1.0);
    }

    float impactLayer(vec2 uv, float t, float density, float slant, float topDown) {
      float sideGround = smoothstep(0.66, 0.78, uv.y);
      float topDownGround = 0.55 + 0.45 * smoothstep(0.05, 0.95, uv.y);
      float ground = mix(sideGround, topDownGround, topDown);
      vec2 p = vec2(uv.x * 58.0 + slant * uv.y * 4.0, (uv.y - 0.62) * 14.0);
      vec2 cell = floor(p);
      vec2 f = fract(p);

      float rnd = hash(cell + 71.23);
      float rnd2 = hash(cell + 9.41);
      float rnd3 = hash(cell + 31.77);
      float phase = fract(t * (0.95 + rnd2 * 0.45) + rnd3);
      float life = 1.0 - smoothstep(0.18, 0.78, phase);

      vec2 center = vec2(rnd2, 0.5 + (rnd - 0.5) * 0.18);
      vec2 delta = vec2(f.x - center.x, (f.y - center.y) * 3.8);
      float radius = 0.05 + phase * 0.28;
      float ring = 1.0 - smoothstep(0.018, 0.052, abs(length(delta) - radius));
      float crown = (1.0 - smoothstep(0.018, 0.075, abs(f.x - center.x)))
        * smoothstep(0.36, 0.58, f.y)
        * (1.0 - smoothstep(0.58, 0.92, f.y + phase * 0.18));
      float visible = step(rnd, mix(density * 0.24, density * 0.09, topDown));
      return (ring * 0.8 + crown * 0.35) * life * visible * ground;
    }

    void main() {
      vec2 safeResolution = max(uResolution, vec2(1.0));
      vec2 screenUv = vUV;
      vec2 uv = screenUv;
      float aspect = safeResolution.x / safeResolution.y;
      uv.x *= aspect;

      float pixelCount = safeResolution.x * safeResolution.y;
      float resolutionFactor = clamp(pixelCount / 700000.0, 0.7, 1.1);

      float densityFactor = clamp(uRainDensity / 220.0, 0.28, 1.45);
      float maxDropFactor = clamp(uMaxDrops / 120.0, 0.45, 1.18);
      float density = clamp(densityFactor * maxDropFactor * resolutionFactor, 0.15, 1.0);

      float wind = clamp(uWindDirection * uWindStrength, -1.2, 1.2);
      float slant = wind * 0.7;
      float speed = 1.35 * uRainSpeed + 0.55;

      float farRain = rainLayer(uv, uTime, 28.0, speed * 0.72, slant * 0.55, density * 0.62, 0.016, 0.32, 0.62, 0.38);
      float midRain = rainLayer(uv, uTime + 3.7, 42.0, speed * 0.96, slant, density * 0.84, 0.019, 0.38, 0.78, 0.62);
      float nearRain = rainLayer(uv, uTime + 8.3, 60.0, speed * 1.18, slant * 1.15, density * 0.58, 0.022, 0.46, 0.9, 0.86);
      float sheetRain = rainLayer(uv, uTime + 1.9, 20.0, speed * 0.58, slant * 0.45, density * 0.28, 0.009, 0.52, 0.9, 0.16);

      float depthFade = mix(0.58, 1.15, screenUv.y);
      float rain = (farRain + midRain + nearRain + sheetRain) * depthFade;
      float impacts = impactLayer(screenUv, uTime, density, slant, clamp(uRainTopDown, 0.0, 1.0));
      float mistNoise = hash(floor(vec2(screenUv.x * 10.0, screenUv.y * 6.0)));
      float mist = (0.01 + mistNoise * 0.018) * density * smoothstep(0.2, 1.0, screenUv.y);

      float brightness = clamp(rain * 0.96 + impacts * 0.22 + mist, 0.0, 1.0);
      vec3 rainColor = mix(vec3(0.48, 0.62, 0.82), vec3(0.82, 0.91, 1.0), clamp(rain + impacts, 0.0, 1.0));
      float alpha = clamp(brightness, 0.0, 0.88);
      finalColor = vec4(rainColor * alpha, alpha);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}
