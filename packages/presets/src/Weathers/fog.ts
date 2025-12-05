import { GlProgram } from "pixi.js";

export function createFogShader(): GlProgram {

  const vertexSrc = /* glsl */`
    precision mediump float;
    attribute vec2 aPosition;
    attribute vec2 aUV;
    varying vec2 vUV;
    void main() {
        vUV = aUV;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSrc = /* glsl */`
    precision mediump float;
    varying vec2 vUV;

    uniform float uTime;
    uniform vec2  uResolution;
    
    uniform float uSpeed;   // movement
    uniform float uScale;   // detail scale
    uniform float uDensity; // opacity

    // ------------------- noise -----------------------------------

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0 - 2.0*f);
      return mix(
          mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), u.x),
          mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), u.x),
          u.y
      );
    }

    float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        for(int i = 0; i < 5; i++){
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
        }
        return v;
    }

    // --------------------------------------------------------------

    void main() {

      vec2 uv = gl_FragCoord.xy / uResolution.xy;

      float fog = 0.0;

      // -------- multi-layer fog ----------------------

      for(int i = 0; i < 3; i++){
        float layer = float(i);

        vec2 p = uv;

        float scale = uScale * (1.0 + layer * 0.6);
        float t = uTime * uSpeed * (0.3 + layer * 0.4);

        // drift
        p.x += t * 0.2;
        p.y += sin(t + p.x * 2.0) * 0.03;

        // extra wave motion
        p.x += cos(p.y * 2.5 + t) * 0.03;

        fog += fbm(p * scale) * (1.0 - layer * 0.25);
      }

      // normalize & threshold
      fog = smoothstep(0.25, 0.8, fog);

      // -------------- vertical fade (optional) -----------------

      float height = uv.y;
      fog *= (1.0 - height * 0.3);

      // -------------- density handling -------------------------

      float density = clamp(uDensity, 0.0, 1.0);

      // alpha based on fog intensity (soft)
      float alpha = fog * density * 0.8;

      // -------------- fog color -----------------------

      vec3 baseColor = vec3(0.92, 0.94, 0.96);

      // slight variation
      float v = fbm(uv * 2.0 + uTime * 0.1) * 0.05;

      vec3 color = baseColor + v;

      // modulate brightness by fog value: bright in high density
      color *= (0.6 + fog * 0.4);

      // ---------- result ---------------------------------

      gl_FragColor = vec4(color, alpha);
    }
  `;

  return new GlProgram({
    vertex: vertexSrc,
    fragment: fragmentSrc
  });
}
