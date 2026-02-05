import { GlProgram } from "pixi.js";

export function createFogShader(): GlProgram {
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
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDensity;
    uniform float uHeight;
    uniform vec2  uViewportOrigin;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;
      value += amp * noise(p);
      p = p * 2.03 + vec2(17.13, 9.37);
      amp *= 0.55;
      value += amp * noise(p);
      p = p * 2.01 + vec2(31.71, 4.23);
      amp *= 0.55;
      value += amp * noise(p);
      p = p * 2.02 + vec2(15.41, 27.19);
      amp *= 0.55;
      value += amp * noise(p);
      return value;
    }

    void main() {
      vec2 safeResolution = max(uResolution, vec2(1.0));
      vec2 rawUv = vUV;
      vec2 uv = rawUv;
      float aspect = safeResolution.x / safeResolution.y;
      uv.x *= aspect;
      vec2 viewportShift = vec2(
        (uViewportOrigin.x / safeResolution.x) * aspect,
        uViewportOrigin.y / safeResolution.y
      );
      vec2 worldUv = uv + viewportShift;

      float normalizedDensity = uDensity;
      if (normalizedDensity > 4.0) {
        normalizedDensity = normalizedDensity / 120.0;
      }
      float density = clamp(normalizedDensity, 0.0, 2.4);
      float scale = clamp(uScale, 0.25, 4.0);
      float speed = max(uSpeed * 8.0, 0.18);

      vec2 driftA = vec2(uTime * 0.06 * speed, uTime * 0.02 * speed);
      vec2 driftB = vec2(-uTime * 0.042 * speed, uTime * 0.016 * speed);
      vec2 wobble = vec2(
        sin(uTime * 0.23 * speed + worldUv.y * 4.0) * 0.03,
        cos(uTime * 0.17 * speed + worldUv.x * 3.2) * 0.018
      );
      vec2 flowUv = worldUv + wobble;

      float layerA = fbm(flowUv * scale + driftA);
      float layerB = fbm(flowUv * (scale * 1.7) + driftB);
      float layerC = fbm(vec2(flowUv.x * 0.75, flowUv.y * 1.35) * (scale * 1.2) + vec2(driftA.x * 0.6, -driftA.y * 0.8));

      float wisps = smoothstep(0.2, 0.82, layerA);
      float detail = smoothstep(0.28, 0.9, layerB);
      float fogPattern = clamp(wisps * 0.55 + detail * 0.3 + layerC * 0.35, 0.0, 1.2);

      float heightControl = clamp(uHeight, 0.0, 1.0);
      float fullScreen = step(0.99, heightControl);
      float groundFog = pow(clamp(rawUv.y, 0.0, 1.0), 0.42);
      float heightFactor = mix(groundFog, 1.0, heightControl);
      heightFactor = mix(heightFactor, 1.0, fullScreen);

      float breathing = 0.9 + 0.1 * sin(uTime * 0.25 * speed);
      float fog = fogPattern * density * heightFactor * breathing;
      float alpha = clamp(fog * 0.82, 0.0, 0.82);

      vec3 baseColor = vec3(0.84, 0.88, 0.94);
      vec3 brightColor = vec3(0.95, 0.97, 1.0);
      vec3 fogColor = mix(baseColor, brightColor, detail * 0.45);
      finalColor = vec4(fogColor * alpha, alpha);
    }
  `;

  return new GlProgram({
    vertex: vertexSrc,
    fragment: fragmentSrc
  });
}

export function createCloudShader(): GlProgram {
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
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDensity;
    uniform float uHeight;
    uniform vec2  uViewportOrigin;
    uniform float uSunIntensity;
    uniform vec2  uSunDirection;
    uniform float uRaySpread;
    uniform float uRayTwinkle;
    uniform float uRayTwinkleSpeed;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.7;
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
      v += a * noise(p + 17.0);
      p *= 2.2;
      a *= 0.5;
      v += a * noise(p + 29.0);
      return v;
    }

    void main() {
      vec2 safeResolution = max(uResolution, vec2(1.0));
      vec2 uv = vUV;
      float aspect = safeResolution.x / safeResolution.y;
      uv.x *= aspect;
      vec2 viewportShift = vec2(
        (uViewportOrigin.x / safeResolution.x) * aspect,
        uViewportOrigin.y / safeResolution.y
      );
      vec2 worldUv = uv + viewportShift;

      float normalizedDensity = uDensity;
      if (normalizedDensity > 4.0) {
        normalizedDensity = normalizedDensity / 100.0;
      }
      float density = clamp(normalizedDensity, 0.0, 2.0);
      float scale = clamp(uScale, 0.2, 4.0);
      float speed = max(uSpeed * 6.0, 0.12);
      vec2 driftMain = vec2(uTime * 0.04 * speed, uTime * 0.012 * speed);
      vec2 driftDetail = vec2(-uTime * 0.028 * speed, uTime * 0.01 * speed);
      vec2 wobble = vec2(
        sin(uTime * 0.18 * speed + worldUv.y * 4.8) * 0.035,
        cos(uTime * 0.16 * speed + worldUv.x * 3.7) * 0.02
      );
      vec2 flowUv = worldUv + wobble;

      float cloudNoise = fbm(flowUv * scale + driftMain);
      float detailNoise = fbm(flowUv * (scale * 2.4) + driftDetail);

      float shape = smoothstep(0.4, 0.93, cloudNoise);
      float detail = smoothstep(0.36, 0.9, detailNoise);
      float puff = shape * (0.55 + 0.45 * detail);

      float heightControl = clamp(uHeight, 0.0, 1.0);
      float fullScreen = step(0.99, heightControl);
      float skyHeight = pow(clamp(1.0 - vUV.y, 0.0, 1.0), 0.68);
      float heightFactor = mix(skyHeight, 1.0, heightControl);
      heightFactor = mix(heightFactor, 1.0, fullScreen);
      float cloud = puff * density * 0.72 * heightFactor;
      float cloudAlpha = clamp(cloud, 0.0, 0.68);

      vec2 sunDir = uSunDirection;
      if (length(sunDir) < 0.0001) {
        sunDir = vec2(0.55, 1.0);
      }
      sunDir = normalize(sunDir);
      vec2 rayUv = worldUv;
      float spread = clamp(uRaySpread, 0.35, 2.5);
      float rayCoord = dot(rayUv, sunDir) * (6.5 / spread);
      float rayNoise = fbm(vec2(rayCoord, rayUv.y * 0.55));
      float shafts = smoothstep(0.5, 0.9, rayNoise);
      float skyFade = pow(clamp(1.0 - vUV.y, 0.0, 1.0), 1.25);
      float cloudGap = clamp(1.0 - cloudAlpha * 1.05, 0.0, 1.0);
      float twinkleAmount = clamp(uRayTwinkle, 0.0, 1.5);
      float twinkleSpeed = max(uRayTwinkleSpeed, 0.01);
      float twinklePulse = 0.5 + 0.5 * sin(uTime * 1.9 * twinkleSpeed + rayCoord * 1.8);
      float twinkleNoise = fbm(vec2(rayCoord * 1.35 + 13.7, uTime * 0.1 * twinkleSpeed));
      float twinkle = mix(
        1.0,
        clamp(0.7 + 0.35 * twinklePulse + 0.25 * twinkleNoise, 0.35, 1.55),
        twinkleAmount
      );
      float rayAlpha = shafts * skyFade * cloudGap * clamp(uSunIntensity, 0.0, 2.0) * twinkle * 0.58;

      vec3 cloudDark = vec3(0.82, 0.87, 0.94);
      vec3 cloudBright = vec3(0.98, 0.99, 1.0);
      vec3 cloudColor = mix(cloudDark, cloudBright, detail * 0.55);
      vec3 rayColor = vec3(1.0, 0.95, 0.8);

      float totalAlpha = cloudAlpha + rayAlpha;
      float alpha = clamp(totalAlpha, 0.0, 0.86);
      vec3 premulColor = cloudColor * cloudAlpha + rayColor * rayAlpha;
      if (totalAlpha > 0.0001) {
        premulColor *= (alpha / totalAlpha);
      }
      finalColor = vec4(premulColor, alpha);
    }
  `;

  return new GlProgram({
    vertex: vertexSrc,
    fragment: fragmentSrc
  });
}
