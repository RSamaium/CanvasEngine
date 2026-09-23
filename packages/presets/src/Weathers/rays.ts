import { GlProgram } from "pixi.js";

/**
 * Standalone light shafts ("god rays"), independent from clouds.
 * Beams come from a source outside the screen (opposite to `uSunDirection`):
 * `uRayFan = 0` gives parallel sun shafts, `1` a fan opening from a corner.
 * Render it with an additive blend mode.
 */
export function createRaysShader(): GlProgram {
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
    precision highp float;
    in vec2 vUV;
    out vec4 finalColor;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSpeed;
    uniform float uSunIntensity;
    uniform vec2  uSunDirection;
    uniform float uRaySpread;
    uniform float uRayTwinkle;
    uniform float uRayTwinkleSpeed;
    uniform float uRayFan;
    uniform float uRayLength;
    uniform float uRayDust;
    uniform vec3  uRayColor;

    float hash(float n) {
      return fract(sin(n * 12.9898) * 43758.5453);
    }

    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise1(float x) {
      float i = floor(x);
      float f = fract(x);
      float u = f * f * (3.0 - 2.0 * f);
      return mix(hash(i), hash(i + 1.0), u);
    }

    void main() {
      vec2 safeResolution = max(uResolution, vec2(1.0));
      float aspect = safeResolution.x / safeResolution.y;
      vec2 p = vec2(vUV.x * aspect, vUV.y);
      vec2 center = vec2(aspect * 0.5, 0.5);

      vec2 dir = uSunDirection;
      if (length(dir) < 0.0001) dir = vec2(0.55, 1.0);
      dir = normalize(dir);
      vec2 perpendicular = vec2(-dir.y, dir.x);

      // Source point: far away for parallel shafts, just off-screen for a fan.
      float fan = clamp(uRayFan, 0.0, 1.0);
      float sourceDistance = mix(40.0, 0.85 + aspect * 0.35, fan);
      vec2 source = center - dir * sourceDistance;
      vec2 fromSource = p - source;
      float along = dot(fromSource, dir);
      float across = dot(fromSource, perpendicular);
      // Angle-based coordinate works for both modes (parallel when the source is far).
      float coord = atan(across, along) * sourceDistance;

      float spread = clamp(uRaySpread, 0.3, 3.0);
      float time = uTime * max(uSpeed, 0.02);
      float twinkleSpeed = max(uRayTwinkleSpeed, 0.01);

      // Two layers of beams with different widths drifting slowly.
      float c1 = coord * (7.0 / spread) + time * 0.35;
      float c2 = coord * (15.0 / spread) - time * 0.22 + 31.7;
      float beams = smoothstep(0.52, 0.92, noise1(c1)) * 0.75;
      beams += smoothstep(0.62, 0.95, noise1(c2)) * 0.45;
      float core = smoothstep(0.82, 0.98, noise1(c1 * 0.5 + 7.1)) * 0.5;
      beams += core;

      // Each beam breathes independently.
      float beamId = floor(c1);
      float pulse = 0.5 + 0.5 * sin(uTime * 1.7 * twinkleSpeed + hash(beamId) * 6.2831);
      float flicker = noise1(c2 * 0.7 + uTime * 0.9 * twinkleSpeed);
      float twinkle = mix(1.0, 0.55 + 0.45 * pulse + 0.25 * flicker, clamp(uRayTwinkle, 0.0, 1.5));

      // Fade along the beam, stronger near the source.
      // 0 on the screen edge closest to the source, ~2 on the opposite edge
      float halfDiagonal = length(center);
      float travel = along - (sourceDistance - halfDiagonal);
      float lengthScale = max(uRayLength, 0.1);
      float falloff = exp(-max(travel, 0.0) * mix(1.1, 0.15, clamp(lengthScale / 2.0, 0.0, 1.0)));
      float edgeFade = smoothstep(0.0, 0.08, vUV.x) * smoothstep(1.0, 0.92, vUV.x)
        * smoothstep(0.0, 0.08, vUV.y) * smoothstep(1.0, 0.92, vUV.y);
      edgeFade = mix(1.0, edgeFade, 0.35);

      float intensity = clamp(uSunIntensity, 0.0, 3.0);
      float alpha = beams * twinkle * falloff * edgeFade * intensity * 0.55;

      // Floating dust motes lit inside the beams.
      vec2 dustUv = p * 38.0 + vec2(time * 0.6, -time * 0.9);
      vec2 cell = floor(dustUv);
      vec2 local = fract(dustUv) - 0.5;
      float seed = hash2(cell);
      vec2 offset = vec2(hash2(cell + 3.1), hash2(cell + 7.7)) - 0.5;
      float mote = smoothstep(0.09, 0.0, length(local - offset * 0.7));
      float moteTwinkle = 0.5 + 0.5 * sin(uTime * (2.0 + seed * 3.0) + seed * 40.0);
      float dust = mote * step(0.72, seed) * moteTwinkle * clamp(uRayDust, 0.0, 2.0);
      alpha += dust * clamp(beams, 0.0, 1.0) * falloff * intensity * 0.6;

      alpha = clamp(alpha, 0.0, 0.85);
      vec3 color = mix(uRayColor, vec3(1.0), clamp(core * 0.6, 0.0, 0.6));
      finalColor = vec4(color * alpha, alpha);
    }
  `;

  return new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });
}
