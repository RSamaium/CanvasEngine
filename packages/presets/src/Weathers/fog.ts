import { GlProgram } from "pixi.js";

export function createFogShader(): GlProgram {
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
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDensity;
    uniform float uHeight;

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
      float a = 0.6;
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
      v += a * noise(p + 23.7);
      p *= 2.03;
      a *= 0.5;
      v += a * noise(p + 11.3);
      return v;
    }

    void main() {
      vec2 uv = vUV;
      float aspect = uResolution.x / uResolution.y;
      uv.x *= aspect;

      float normalizedDensity = uDensity;
      if (normalizedDensity > 4.0) {
        normalizedDensity = normalizedDensity / 100.0;
      }
      float density = clamp(normalizedDensity, 0.0, 2.0);

      float scale = max(uScale, 0.3);
      vec2 drift = vec2(uTime * 0.02 * uSpeed, uTime * 0.015 * uSpeed);
      float fogNoise = fbm(uv * scale + drift);

      float softness = smoothstep(0.35, 1.0, fogNoise);
      float heightControl = clamp(uHeight, 0.0, 1.0);
      float fullScreen = step(0.99, heightControl);
      float baseHeight = 0.6 + 0.4 * uv.y;
      float heightFactor = mix(baseHeight, 1.0, heightControl);
      heightFactor = mix(heightFactor, 1.0, fullScreen);

      float fog = softness * density * 0.45 * heightFactor;
      float alpha = clamp(fog, 0.0, 0.35);

      vec3 fogColor = vec3(1.0);
      gl_FragColor = vec4(fogColor * alpha, alpha);
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
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDensity;
    uniform float uHeight;

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
      vec2 uv = vUV;
      float aspect = uResolution.x / uResolution.y;
      uv.x *= aspect;

      float normalizedDensity = uDensity;
      if (normalizedDensity > 4.0) {
        normalizedDensity = normalizedDensity / 100.0;
      }
      float density = clamp(normalizedDensity, 0.0, 2.0);

      float scale = max(uScale, 0.2);
      vec2 drift = vec2(uTime * 0.03 * uSpeed, uTime * 0.01 * uSpeed);
      float cloudNoise = fbm(uv * scale + drift);
      float detailNoise = fbm(uv * (scale * 2.4) + drift * 1.7);

      float shape = smoothstep(0.45, 0.95, cloudNoise);
      float detail = smoothstep(0.4, 0.9, detailNoise);
      float puff = shape * (0.6 + 0.4 * detail);

      float heightControl = clamp(uHeight, 0.0, 1.0);
      float fullScreen = step(0.99, heightControl);
      float baseHeight = 0.6 + 0.4 * uv.y;
      float heightFactor = mix(baseHeight, 1.0, heightControl);
      heightFactor = mix(heightFactor, 1.0, fullScreen);
      float cloud = puff * density * 0.6 * heightFactor;
      float alpha = clamp(cloud, 0.0, 0.55);

      vec3 cloudColor = vec3(1.0);
      gl_FragColor = vec4(cloudColor * alpha, alpha);
    }
  `;

  return new GlProgram({
    vertex: vertexSrc,
    fragment: fragmentSrc
  });
}
