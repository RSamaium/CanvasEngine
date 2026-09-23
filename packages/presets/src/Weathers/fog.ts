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
    uniform float uFogOpacity;
    uniform float uFogSoftness;
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
      float speed = max(uSpeed * 5.0, 0.15);

      vec2 driftA = vec2(uTime * 0.075 * speed, uTime * 0.018 * speed);
      vec2 driftB = vec2(-uTime * 0.052 * speed, uTime * 0.013 * speed);
      vec2 wobble = vec2(
        sin(uTime * 0.2 * speed + worldUv.y * 4.0) * 0.025,
        cos(uTime * 0.14 * speed + worldUv.x * 3.2) * 0.014
      );
      vec2 flowUv = worldUv + wobble;

      vec2 domainWarp = vec2(
        fbm(flowUv * (scale * 0.52) + driftB + 13.4),
        fbm(flowUv * (scale * 0.57) - driftB + 41.8)
      ) - 0.5;
      vec2 bankUvA = vec2(flowUv.x * 0.62, flowUv.y * 1.5) + domainWarp * 0.22;
      vec2 bankUvB = vec2(flowUv.x * 0.82, flowUv.y * 2.05) - domainWarp * 0.16;
      float layerA = fbm(bankUvA * (scale * 1.7) + driftA);
      float layerB = fbm(bankUvB * (scale * 1.3) + driftB);
      float detail = fbm((flowUv + domainWarp * 0.1) * (scale * 4.2) - driftA * 0.45);

      float heightControl = clamp(uHeight, 0.0, 1.0);
      float coverage = clamp(density * mix(0.88, 1.12, heightControl), 0.0, 2.2);
      float threshold = mix(0.66, 0.44, clamp(coverage / 1.7, 0.0, 1.0));
      float edgeWidth = mix(0.025, 0.105, clamp(uFogSoftness, 0.0, 1.0));
      float bankA = smoothstep(threshold - edgeWidth, threshold + edgeWidth, layerA);
      float bankB = smoothstep(threshold - edgeWidth * 0.65, threshold + edgeWidth * 1.2, layerB);

      // Thin contour bands give the mist recognizable RPG-style tendrils.
      float filament = 1.0 - smoothstep(0.035, 0.135, abs(layerB - (threshold + 0.015)));
      filament *= smoothstep(0.3, 0.78, detail);
      float breakup = mix(0.48, 1.0, smoothstep(0.26, 0.82, detail));
      float fogMask = clamp(bankA * 0.72 + bankB * 0.34 + filament * 0.2, 0.0, 1.0);
      fogMask *= breakup;

      float holeNoise = fbm(flowUv * (scale * 1.05) - driftA * 0.3 + 67.2);
      float holes = smoothstep(0.76, 0.98, holeNoise);
      fogMask *= 1.0 - holes * 0.72;

      float breathing = 0.94 + 0.06 * sin(uTime * 0.22 * speed);
      float alpha = clamp(fogMask * clamp(uFogOpacity, 0.0, 0.72) * breathing, 0.0, 0.72);

      vec3 baseColor = vec3(0.72, 0.8, 0.84);
      vec3 brightColor = vec3(0.93, 0.96, 0.97);
      vec3 fogColor = mix(baseColor, brightColor, smoothstep(0.35, 0.85, detail) * 0.72);
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
    precision highp float;
    in vec2 vUV;
    out vec4 finalColor;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uDensity;
    uniform float uHeight;
    uniform vec2  uViewportOrigin;
    uniform float uShadowIntensity;
    uniform float uShadowSoftness;
    uniform float uCloudOpacity;
    uniform float uCloudAltitude;
    uniform float uSunIntensity;
    uniform vec2  uSunDirection;
    uniform float uRaySpread;
    uniform float uRayTwinkle;
    uniform float uRayTwinkleSpeed;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    vec2 hash2(vec2 p) {
      return vec2(hash(p + 17.17), hash(p + 47.43));
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

    float cloudFieldAt(vec2 p, float scale, vec2 driftMain, vec2 driftDetail) {
      float body = fbm(p * (scale * 3.2) + driftMain);
      vec2 shapeWarp = vec2(
        fbm(p * (scale * 0.9) + driftDetail + 11.7),
        fbm(p * (scale * 0.95) - driftDetail + 37.1)
      );
      float puffs = fbm((p + (shapeWarp - 0.6) * 0.38) * (scale * 5.5) + driftDetail);
      return body * 0.78 + puffs * 0.22;
    }

    // Distance to the closest feature point: 1 - F1 gives round "billows".
    float worley(vec2 p) {
      vec2 cell = floor(p);
      vec2 local = fract(p);
      float closest = 1.4;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = hash2(cell + neighbor);
          closest = min(closest, length(neighbor + point - local));
        }
      }
      return closest;
    }

    // Signed cumulus density seen from above: > 0 inside the cloud.
    // Large warped masses carry the silhouette, cellular billows give the
    // cauliflower edges and a fine fbm breaks the regularity.
    float cumulusDensity(vec2 p, float coverage) {
      vec2 warp = vec2(fbm(p * 0.45 + 3.7), fbm(p * 0.45 + 41.3)) - 0.6;
      vec2 q = p + warp * 0.9;
      float envelope = smoothstep(0.4, 0.8, fbm(q * 0.42));
      float billows = 1.0 - worley(q * 1.7);
      float puffs = 1.0 - worley(q * 3.9 + 7.3);
      float d = envelope * 0.72 + billows * 0.2 + puffs * 0.08;
      return d - mix(0.72, 0.42, coverage);
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

      vec2 sunDir = uSunDirection;
      if (length(sunDir) < 0.0001) {
        sunDir = vec2(0.55, 1.0);
      }
      sunDir = normalize(sunDir);

      // Cloud mode always projects soft ground shadows. The optional overhead
      // layer is composited later so the shadows cannot read as atmospheric fog.
      float cloudField = cloudFieldAt(flowUv, scale, driftMain, driftDetail);

      float coverage = clamp(density * mix(0.9, 1.08, clamp(uHeight, 0.0, 1.0)), 0.0, 1.5);
      float coverageMix = clamp((coverage - 0.3) / 1.05, 0.0, 1.0);
      float threshold = mix(0.69, 0.48, coverageMix);
      float edgeWidth = mix(0.035, 0.105, clamp(uShadowSoftness, 0.0, 1.0));
      float penumbra = smoothstep(threshold - edgeWidth, threshold + edgeWidth, cloudField);
      float umbra = smoothstep(threshold + edgeWidth * 0.15, threshold + edgeWidth * 1.65, cloudField);
      float shadowMask = clamp(penumbra * 0.62 + umbra * 0.38, 0.0, 1.0);
      float shadowAlpha = shadowMask * clamp(uShadowIntensity, 0.0, 0.65);

      vec2 rayUv = worldUv;
      float spread = clamp(uRaySpread, 0.35, 2.5);
      float rayCoord = dot(rayUv, sunDir) * (6.5 / spread);
      float rayNoise = fbm(vec2(rayCoord, rayUv.y * 0.55));
      float shafts = smoothstep(0.5, 0.9, rayNoise);
      float cloudGap = clamp(1.0 - shadowMask, 0.0, 1.0);
      float twinkleAmount = clamp(uRayTwinkle, 0.0, 1.5);
      float twinkleSpeed = max(uRayTwinkleSpeed, 0.01);
      float twinklePulse = 0.5 + 0.5 * sin(uTime * 1.9 * twinkleSpeed + rayCoord * 1.8);
      float twinkleNoise = fbm(vec2(rayCoord * 1.35 + 13.7, uTime * 0.1 * twinkleSpeed));
      float twinkle = mix(
        1.0,
        clamp(0.7 + 0.35 * twinklePulse + 0.25 * twinkleNoise, 0.35, 1.55),
        twinkleAmount
      );
      float rayAlpha = shafts * cloudGap * clamp(uSunIntensity, 0.0, 2.0) * twinkle * 0.22;

      vec3 shadowColor = vec3(0.025, 0.045, 0.075);
      vec3 rayColor = vec3(1.0, 0.95, 0.8);

      float atmosphericTotal = shadowAlpha + rayAlpha;
      float atmosphericAlpha = clamp(atmosphericTotal, 0.0, 0.72);
      vec3 atmosphericColor = shadowColor * shadowAlpha + rayColor * rayAlpha;
      if (atmosphericTotal > 0.0001) {
        atmosphericColor *= atmosphericAlpha / atmosphericTotal;
      }

      // Optional overhead cloud layer. Irregular anisotropic banks and eroded
      // contours create a grounded RTS look; offset sampling adds directional
      // volume without turning the layer into a white atmospheric veil.
      float visibleOpacity = clamp(uCloudOpacity, 0.0, 0.95);
      float visibleAlpha = 0.0;
      float projectedShadowAlpha = 0.0;
      vec3 visibleColor = vec3(0.0);
      if (visibleOpacity > 0.001) {
        float altitude = clamp(uCloudAltitude, 0.0, 1.0);
        float softness = clamp(uShadowSoftness, 0.0, 1.0);
        float cloudScale = scale * 6.0;
        vec2 cloudDrift = driftMain * 1.6;
        vec2 cloudUv = worldUv * cloudScale + cloudDrift;
        float projection = mix(0.25, 1.6, altitude);

        float groundDensity = cumulusDensity(cloudUv - sunDir * projection, coverageMix);
        float projectedMask = smoothstep(-0.02, mix(0.06, 0.2, softness), groundDensity);
        projectedShadowAlpha = projectedMask * clamp(uShadowIntensity, 0.0, 0.65) * visibleOpacity * 0.75;

        // The visible layer casts its own shadow: the uncorrelated shadow-only
        // field is replaced, and sun shafts only pass between real shadows.
        float gapRays = shafts * (1.0 - projectedMask) * clamp(uSunIntensity, 0.0, 2.0) * twinkle * 0.18;
        atmosphericAlpha = clamp(gapRays, 0.0, 0.72);
        atmosphericColor = rayColor * atmosphericAlpha;

        float density = cumulusDensity(cloudUv, coverageMix);
        if (density > -0.03) {
          // Self shadowing: denser matter toward the sun hides this point.
          float towardSun = cumulusDensity(cloudUv - sunDir * 0.12, coverageMix);
          float thickness = clamp(density / 0.22, 0.0, 1.0);
          float light = clamp(0.62 + (density - towardSun) * 3.2 + thickness * 0.18, 0.0, 1.0);
          float grain = fbm(cloudUv * 7.0 - cloudDrift * 0.5);
          light = clamp(light + (grain - 0.6) * 0.18, 0.0, 1.0);

          vec3 shade = vec3(0.56, 0.63, 0.76);
          vec3 mid = vec3(0.84, 0.88, 0.94);
          vec3 lit = vec3(1.0, 0.985, 0.95);
          visibleColor = mix(shade, mid, smoothstep(0.1, 0.55, light));
          visibleColor = mix(visibleColor, lit, smoothstep(0.5, 0.95, light));
          // Silver lining on thin edges facing the sun
          float rim = (1.0 - thickness) * smoothstep(0.55, 0.9, light);
          visibleColor += vec3(0.06, 0.05, 0.03) * rim;

          float edge = smoothstep(-0.03, mix(0.05, 0.14, softness), density);
          visibleAlpha = edge * mix(0.82, 1.0, thickness) * visibleOpacity;
        }
      }

      atmosphericColor = shadowColor * projectedShadowAlpha
        + atmosphericColor * (1.0 - projectedShadowAlpha);
      atmosphericAlpha = projectedShadowAlpha
        + atmosphericAlpha * (1.0 - projectedShadowAlpha);
      vec3 premulColor = visibleColor * visibleAlpha + atmosphericColor * (1.0 - visibleAlpha);
      float alpha = visibleAlpha + atmosphericAlpha * (1.0 - visibleAlpha);
      finalColor = vec4(premulColor, alpha);
    }
  `;

  return new GlProgram({
    vertex: vertexSrc,
    fragment: fragmentSrc
  });
}
