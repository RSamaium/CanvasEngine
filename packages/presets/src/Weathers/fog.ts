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

    float cloudClusterField(vec2 p, float coverage) {
      vec2 cell = floor(p);
      vec2 local = fract(p);
      float broadNoise = clamp(fbm(p * 1.35 + 71.4) * 0.816, 0.0, 1.0);
      float edgeNoise = clamp(fbm(p * 4.6 + 19.7) * 0.816, 0.0, 1.0);
      float chippedNoise = noise(p * 13.0 + 8.9);
      float field = 0.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 id = cell + neighbor;
          vec2 seed = hash2(id);
          vec2 center = neighbor + mix(vec2(0.36), vec2(0.64), seed);
          float presence = step(mix(0.87, 0.58, coverage), hash(id + 83.1));
          vec2 delta = local - center;

          float angle = (seed.x - 0.5) * 1.15;
          float ca = cos(angle);
          float sa = sin(angle);
          vec2 q = mat2(ca, -sa, sa, ca) * delta;
          float phase = hash(id + 12.6) * 6.2831853;

          // An anisotropic body with multi-scale erosion reads as a natural
          // cloud bank from above, rather than as a union of round puffs.
          vec2 bodySize = vec2(mix(0.62, 0.82, seed.x), mix(0.29, 0.43, seed.y));
          float bodyDistance = length(q / bodySize);
          float polar = atan(q.y, q.x);
          float contour = (broadNoise - 0.5) * 0.7;
          contour += (chippedNoise - 0.5) * 0.1;
          contour += sin(polar * 3.0 + phase) * 0.11;
          contour += sin(polar * 7.0 - phase * 1.7) * 0.045;
          float body = 1.0 - smoothstep(0.72 + contour, 1.06 + contour, bodyDistance);

          float branchSide = mix(-1.0, 1.0, step(0.5, hash(id + 31.8)));
          vec2 branchQ = q - vec2(branchSide * mix(0.32, 0.46, seed.y), mix(-0.12, 0.16, seed.x));
          vec2 branchSize = vec2(mix(0.38, 0.58, seed.y), mix(0.17, 0.28, seed.x));
          float branch = 1.0 - smoothstep(0.64, 1.08, length(branchQ / branchSize));

          vec2 wispQ = q + vec2(branchSide * mix(0.42, 0.58, seed.x), mix(0.08, 0.22, seed.y));
          vec2 wispSize = vec2(mix(0.28, 0.46, seed.x), mix(0.1, 0.18, seed.y));
          float wisp = 1.0 - smoothstep(0.58, 1.12, length(wispQ / wispSize));

          float cluster = max(body, max(branch * 0.86, wisp * 0.64));
          float fracturedDensity = edgeNoise * 0.68 + chippedNoise * 0.32;
          float edgeErosion = smoothstep(0.44, 0.74, fracturedDensity + cluster * 0.42);
          float protectedCore = smoothstep(0.48, 0.78, cluster);
          float erosion = max(edgeErosion, protectedCore);
          cluster *= erosion;
          field = max(field, cluster * presence);
        }
      }
      return field;
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
        float projectionOffset = mix(0.035, 0.28, altitude);
        vec2 visibleUv = flowUv - sunDir * projectionOffset;
        vec2 groundClusterUv = flowUv * (scale * 5.0) + driftMain * 1.35;
        vec2 clusterUv = groundClusterUv - sunDir * projectionOffset * (scale * 5.0);
        float groundCluster = cloudClusterField(groundClusterUv, coverageMix);
        float cluster = cloudClusterField(clusterUv, coverageMix);
        float litCluster = cloudClusterField(clusterUv - sunDir * 0.055, coverageMix);
        float projectedSoftness = mix(0.26, 0.5, clamp(uShadowSoftness, 0.0, 1.0));
        float projectedMask = smoothstep(0.035, projectedSoftness, groundCluster);
        projectedShadowAlpha = projectedMask
          * clamp(uShadowIntensity, 0.0, 0.65)
          * visibleOpacity
          * 0.62;
        float silhouette = smoothstep(0.09, 0.38, cluster);
        float core = smoothstep(0.34, 0.88, cluster);
        float relief = clamp(0.5 + (litCluster - cluster) * 2.8, 0.0, 1.0);
        float surfaceDetail = clamp(fbm(visibleUv * (scale * 7.0) - driftDetail * 0.35) * 0.816, 0.0, 1.0);
        float billowDetail = clamp(fbm(visibleUv * (scale * 12.5) + driftMain * 0.2 + 43.2) * 0.816, 0.0, 1.0);
        float fineDetail = noise(visibleUv * (scale * 19.0) + driftDetail * 0.4);
        float lighting = clamp(0.08 + core * 0.22 + relief * 0.3 + surfaceDetail * 0.2 + billowDetail * 0.16 + fineDetail * 0.04, 0.0, 1.0);

        vec3 cloudUnderside = vec3(0.32, 0.37, 0.43);
        vec3 cloudMid = vec3(0.58, 0.62, 0.64);
        vec3 cloudTop = vec3(0.87, 0.88, 0.84);
        visibleColor = mix(cloudUnderside, cloudMid, smoothstep(0.16, 0.58, lighting));
        visibleColor = mix(visibleColor, cloudTop, smoothstep(0.56, 0.9, lighting));
        visibleColor *= mix(0.82, 1.08, billowDetail);
        float densityVariation = mix(0.62, 1.0, smoothstep(0.22, 0.78, surfaceDetail + core * 0.3));
        visibleAlpha = silhouette * mix(0.24, 1.0, core) * densityVariation * visibleOpacity;
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
