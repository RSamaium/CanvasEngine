import {
  tick,
  useProps,
  h,
  Mesh,
  signal,
  mount,
  effect as watchEffect,
} from "canvasengine";
import { Geometry, Shader, UniformGroup } from "pixi.js";
import { createRainShader } from "./rain";
import { createSnowShader } from "./snow";
import { createFogShader, createCloudShader } from "./fog";

export const RAIN_PRESETS = {
  lightRain: { effect: "rain", speed: 0.35, windDirection: 0.1, windStrength: 0.15, density: 110, maxDrops: 90 },
  steadyRain: { effect: "rain", speed: 0.6, windDirection: 0.2, windStrength: 0.3, density: 180, maxDrops: 120 },
  stormRain: { effect: "rain", speed: 1.4, windDirection: 0.7, windStrength: 0.75, density: 300, maxDrops: 150 },
} as const;

export const SNOW_PRESETS = {
  lightSnow: { effect: "snow", speed: 0.35, windDirection: 0.1, windStrength: 0.18, density: 90, maxDrops: 100 },
  winterSnow: { effect: "snow", speed: 0.5, windDirection: 0.2, windStrength: 0.28, density: 150, maxDrops: 130 },
  blizzardSnow: { effect: "snow", speed: 1.1, windDirection: 0.8, windStrength: 0.75, density: 290, maxDrops: 160 },
} as const;

export const FOG_PRESETS = {
  rpgMorningMist: { effect: "fog", speed: 0.16, density: 0.75, height: 0.45, scale: 1.35 },
  rpgForestFog: { effect: "fog", speed: 0.22, density: 1.0, height: 0.62, scale: 1.75 },
  rpgSwampFog: { effect: "fog", speed: 0.14, density: 1.3, height: 0.55, scale: 2.1 },
  rpgNightFog: { effect: "fog", speed: 0.12, density: 1.15, height: 0.58, scale: 1.9 },
  rpgHeavyFog: { effect: "fog", speed: 0.1, density: 1.7, height: 0.72, scale: 2.3 },
} as const;

export const CLOUD_PRESETS = {
  lightClouds: { effect: "cloud", speed: 0.16, density: 0.55, height: 0.72, scale: 1.35, sunIntensity: 1.0, sunAngle: 0.84, raySpread: 0.92, rayTwinkle: 0.25, rayTwinkleSpeed: 0.9 },
  overcastClouds: { effect: "cloud", speed: 0.12, density: 0.95, height: 0.86, scale: 1.85, sunIntensity: 0.4, sunAngle: 0.95, raySpread: 1.15, rayTwinkle: 0.18, rayTwinkleSpeed: 0.7 },
  stormClouds: { effect: "cloud", speed: 0.2, density: 1.25, height: 0.94, scale: 2.2, sunIntensity: 0.12, sunAngle: 1.08, raySpread: 1.35, rayTwinkle: 0.12, rayTwinkleSpeed: 0.6 },
  goldenHourRays: { effect: "cloud", speed: 0.14, density: 0.72, height: 0.82, scale: 1.5, sunIntensity: 1.3, sunAngle: 0.72, raySpread: 0.78, rayTwinkle: 0.78, rayTwinkleSpeed: 1.4 },
  sunnySoftRays: { effect: "cloud", speed: 0.13, density: 0.62, height: 0.76, scale: 1.4, sunIntensity: 1.05, sunAngle: 0.8, raySpread: 0.95, rayTwinkle: 0.35, rayTwinkleSpeed: 0.95 },
  sunsetTwinkleRays: { effect: "cloud", speed: 0.1, density: 0.74, height: 0.84, scale: 1.55, sunIntensity: 1.35, sunAngle: 0.64, raySpread: 0.8, rayTwinkle: 1.0, rayTwinkleSpeed: 1.6 },
  dramaticCrepuscularRays: { effect: "cloud", speed: 0.11, density: 0.9, height: 0.9, scale: 1.9, sunIntensity: 1.5, sunAngle: 0.7, raySpread: 0.68, rayTwinkle: 0.6, rayTwinkleSpeed: 1.2 },
  morningHazeRays: { effect: "cloud", speed: 0.09, density: 0.52, height: 0.7, scale: 1.3, sunIntensity: 0.9, sunAngle: 0.9, raySpread: 1.05, rayTwinkle: 0.42, rayTwinkleSpeed: 0.8 },
} as const;

export const WEATHER_PRESETS = {
  rain: RAIN_PRESETS,
  snow: SNOW_PRESETS,
  fog: FOG_PRESETS,
  cloud: CLOUD_PRESETS,
} as const;


/**
 * Weather Effect Component (optimized)
 */
export const WeatherEffect = (options) => {
  const {
    effect: effectType = signal('rain'),
    speed = signal(0.5),
    windDirection = signal(0.0),
    windStrength = signal(0.2),
    density = signal(120.0),  // Reduced default density for better performance
    maxDrops = signal(80.0),  // Reduced default maxDrops for better performance
    height = signal(1.0),  // Fog/cloud height parameter (0 = bottom, 1 = full)
    scale = signal(2.0),  // Fog noise scale parameter
    sunIntensity = signal(0.85),  // Cloud sunlight shaft intensity
    sunAngle = signal(0.85),  // Cloud sunlight direction angle in radians
    raySpread = signal(1.0),  // Cloud sunlight ray spread
    rayTwinkle = signal(0.45),  // Cloud sunlight twinkle amount
    rayTwinkleSpeed = signal(1.0),  // Cloud sunlight twinkle speed
    resolution,
    ...meshProps
  } = useProps(options);

  // Auto-detect resolution from canvas if not provided
  const defaultResolution = signal([1000, 1000]);
  const viewWidth = signal(defaultResolution()[0]);
  const viewHeight = signal(defaultResolution()[1]);
  const originX = signal(0);
  const originY = signal(0);
  let viewportRef;
  const effectSignal =
    typeof effectType === "function" ? effectType : signal(effectType);
  const resolutionSignal = resolution
    ? (typeof resolution === "function" ? resolution : signal(resolution))
    : defaultResolution;

  // Try to get canvas size from context if available
  mount((element) => {
    const context = element.props.context;
    let parent = element.parent;
    let isInsideViewport = false;
    while (parent) {
      if (parent.tag === "Viewport") {
        isInsideViewport = true;
        break;
      }
      parent = parent.parent;
    }
    viewportRef = isInsideViewport ? context?.viewport : undefined;
    if (viewportRef?.getVisibleBounds) {
      const bounds = viewportRef.getVisibleBounds();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        defaultResolution.set([bounds.width, bounds.height]);
        viewWidth.set(bounds.width);
        viewHeight.set(bounds.height);
        originX.set(bounds.x);
        originY.set(bounds.y);
      }
    }
    if (context?.canvasSize) {
      watchEffect(() => {
        const size = context.canvasSize();
        if (size && size.width > 0 && size.height > 0) {
          if (!viewportRef?.getVisibleBounds) {
            defaultResolution.set([size.width, size.height]);
            viewWidth.set(size.width);
            viewHeight.set(size.height);
            originX.set(0);
            originY.set(0);
          }
        }
      });
    }
  });

  const speedSignal = typeof speed === "function" ? speed : signal(speed);
  const windDirectionSignal =
    typeof windDirection === "function" ? windDirection : signal(windDirection);
  const windStrengthSignal =
    typeof windStrength === "function" ? windStrength : signal(windStrength);
  const densitySignal =
    typeof density === "function" ? density : signal(density);
  const maxDropsSignal =
    typeof maxDrops === "function" ? maxDrops : signal(maxDrops);
  const heightSignal =
    typeof height === "function" ? height : signal(height);
  const scaleSignal =
    typeof scale === "function" ? scale : signal(scale);
  const sunIntensitySignal =
    typeof sunIntensity === "function" ? sunIntensity : signal(sunIntensity);
  const sunAngleSignal =
    typeof sunAngle === "function" ? sunAngle : signal(sunAngle);
  const raySpreadSignal =
    typeof raySpread === "function" ? raySpread : signal(raySpread);
  const rayTwinkleSignal =
    typeof rayTwinkle === "function" ? rayTwinkle : signal(rayTwinkle);
  const rayTwinkleSpeedSignal =
    typeof rayTwinkleSpeed === "function" ? rayTwinkleSpeed : signal(rayTwinkleSpeed);

  const normalizeHeightValue = (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : 1.0;
  const normalizeSunIntensityValue = (value) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0.85;
  const normalizeSunAngleValue = (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0.85;
  const normalizeRaySpreadValue = (value) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1.0;
  const normalizeRayTwinkleValue = (value) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0.45;
  const normalizeRayTwinkleSpeedValue = (value) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1.0;
  const sunDirectionFromAngle = (angle) => [Math.cos(angle), Math.sin(angle)];
  const normalizeResolutionValue = (value) => {
    if (!Array.isArray(value)) return [1, 1];
    const width =
      typeof value[0] === "number" && Number.isFinite(value[0]) && value[0] > 0
        ? value[0]
        : 1;
    const height =
      typeof value[1] === "number" && Number.isFinite(value[1]) && value[1] > 0
        ? value[1]
        : 1;
    return [width, height];
  };

  let glProgram;
  let uniformConfig;

  if (effectSignal() === 'rain') {
    glProgram = createRainShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: normalizeResolutionValue(resolutionSignal()), type: "vec2<f32>" },
      uRainSpeed: { value: speedSignal(), type: "f32" },
      uWindDirection: { value: windDirectionSignal(), type: "f32" },
      uWindStrength: { value: windStrengthSignal(), type: "f32" },
      uRainDensity: { value: densitySignal(), type: "f32" },
      uMaxDrops: { value: maxDropsSignal(), type: "f32" },
    };
  } else if (effectSignal() === 'snow') {
    glProgram = createSnowShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: normalizeResolutionValue(resolutionSignal()), type: "vec2<f32>" },
      uSnowSpeed: { value: speedSignal(), type: "f32" },
      uWindDirection: { value: windDirectionSignal(), type: "f32" },
      uWindStrength: { value: windStrengthSignal(), type: "f32" },
      uSnowDensity: { value: densitySignal(), type: "f32" },
      uMaxFlakes: { value: maxDropsSignal(), type: "f32" },
    };
  } else if (effectSignal() === 'fog') {
    glProgram = createFogShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: normalizeResolutionValue(resolutionSignal()), type: "vec2<f32>" },
      uSpeed: { value: speedSignal(), type: "f32" },
      uScale: { value: scaleSignal(), type: "f32" },
      uDensity: { value: densitySignal(), type: "f32" },
      uHeight: { value: normalizeHeightValue(heightSignal()), type: "f32" },
      uViewportOrigin: { value: [originX(), originY()], type: "vec2<f32>" },
    };
  } else if (effectSignal() === 'cloud') {
    const initialSunAngle = normalizeSunAngleValue(sunAngleSignal());
    glProgram = createCloudShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: normalizeResolutionValue(resolutionSignal()), type: "vec2<f32>" },
      uSpeed: { value: speedSignal(), type: "f32" },
      uScale: { value: scaleSignal(), type: "f32" },
      uDensity: { value: densitySignal(), type: "f32" },
      uHeight: { value: normalizeHeightValue(heightSignal()), type: "f32" },
      uViewportOrigin: { value: [originX(), originY()], type: "vec2<f32>" },
      uSunIntensity: { value: normalizeSunIntensityValue(sunIntensitySignal()), type: "f32" },
      uSunDirection: { value: sunDirectionFromAngle(initialSunAngle), type: "vec2<f32>" },
      uRaySpread: { value: normalizeRaySpreadValue(raySpreadSignal()), type: "f32" },
      uRayTwinkle: { value: normalizeRayTwinkleValue(rayTwinkleSignal()), type: "f32" },
      uRayTwinkleSpeed: { value: normalizeRayTwinkleSpeedValue(rayTwinkleSpeedSignal()), type: "f32" },
    };
  } else {
    throw new Error(`Unknown weather effect: ${effectSignal()}. Supported: rain, snow, fog, cloud`);
  }

  const uniformGroup = new UniformGroup(uniformConfig);

  const shader = new Shader({
    glProgram,
    resources: { uniforms: uniformGroup },
  });

  const geometry = new Geometry({
    attributes: {
      aPosition: [0, 0, 1, 0, 1, 1, 0, 1],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  // Initialize time with a random offset to prevent initial clustering
  let timeAccumulator = Math.random() * 10.0;
  
  // Cache previous values to avoid unnecessary uniform updates
  let prevResolution = [...normalizeResolutionValue(resolutionSignal())];
  let prevWindDirection = windDirectionSignal();
  let prevWindStrength = windStrengthSignal();
  let prevSpeed = speedSignal();
  let prevDensity = densitySignal();
  let prevMaxDrops = maxDropsSignal();
  let prevHeight = heightSignal();
  let prevScale = scaleSignal();
  let prevSunIntensity = normalizeSunIntensityValue(sunIntensitySignal());
  let prevSunAngle = normalizeSunAngleValue(sunAngleSignal());
  let prevRaySpread = normalizeRaySpreadValue(raySpreadSignal());
  let prevRayTwinkle = normalizeRayTwinkleValue(rayTwinkleSignal());
  let prevRayTwinkleSpeed = normalizeRayTwinkleSpeedValue(rayTwinkleSpeedSignal());
  let prevOriginX = originX();
  let prevOriginY = originY();

  tick(({ deltaTime }) => {
    if (viewportRef?.getVisibleBounds) {
      const bounds = viewportRef.getVisibleBounds();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const nextWidth = bounds.width;
        const nextHeight = bounds.height;
        const nextOriginX = bounds.x;
        const nextOriginY = bounds.y;
        if (nextWidth !== viewWidth()) viewWidth.set(nextWidth);
        if (nextHeight !== viewHeight()) viewHeight.set(nextHeight);
        if (nextOriginX !== originX()) originX.set(nextOriginX);
        if (nextOriginY !== originY()) originY.set(nextOriginY);
        const currentResolution = defaultResolution();
        if (currentResolution[0] !== nextWidth || currentResolution[1] !== nextHeight) {
          defaultResolution.set([nextWidth, nextHeight]);
        }
      }
    }

    // Always update time (required for animation)
    timeAccumulator += deltaTime / 600;
    uniformGroup.uniforms.uTime = timeAccumulator;

    // Only update resolution if it changed
    const currentResolution = normalizeResolutionValue(resolutionSignal());
    if (currentResolution[0] !== prevResolution[0] || currentResolution[1] !== prevResolution[1]) {
      uniformGroup.uniforms.uResolution = currentResolution;
      prevResolution = [...currentResolution];
    }

    if (effectSignal() === 'fog' || effectSignal() === 'cloud') {
      const currentOriginX = originX();
      const currentOriginY = originY();
      if (currentOriginX !== prevOriginX || currentOriginY !== prevOriginY) {
        uniformGroup.uniforms.uViewportOrigin = [currentOriginX, currentOriginY];
        prevOriginX = currentOriginX;
        prevOriginY = currentOriginY;
      }
    }

    // Only update wind if it changed
    const currentWindDirection = windDirectionSignal();
    if (currentWindDirection !== prevWindDirection) {
      uniformGroup.uniforms.uWindDirection = currentWindDirection;
      prevWindDirection = currentWindDirection;
    }

    // Update wind strength only for rain and snow (fog doesn't use it)
    if (effectSignal() === 'rain' || effectSignal() === 'snow') {
      const currentWindStrength = windStrengthSignal();
      if (currentWindStrength !== prevWindStrength) {
        uniformGroup.uniforms.uWindStrength = currentWindStrength;
        prevWindStrength = currentWindStrength;
      }
    }

    if (effectSignal() === 'rain') {
      // Only update rain-specific uniforms if they changed
      const currentSpeed = speedSignal();
      if (currentSpeed !== prevSpeed) {
        uniformGroup.uniforms.uRainSpeed = currentSpeed;
        prevSpeed = currentSpeed;
      }

      const currentDensity = densitySignal();
      if (currentDensity !== prevDensity) {
        uniformGroup.uniforms.uRainDensity = currentDensity;
        prevDensity = currentDensity;
      }

      const currentMaxDrops = maxDropsSignal();
      if (currentMaxDrops !== prevMaxDrops) {
        uniformGroup.uniforms.uMaxDrops = currentMaxDrops;
        prevMaxDrops = currentMaxDrops;
      }
    } else if (effectSignal() === 'snow') {
      // Only update snow-specific uniforms if they changed
      const currentSpeed = speedSignal();
      if (currentSpeed !== prevSpeed) {
        uniformGroup.uniforms.uSnowSpeed = currentSpeed;
        prevSpeed = currentSpeed;
      }

      const currentDensity = densitySignal();
      if (currentDensity !== prevDensity) {
        uniformGroup.uniforms.uSnowDensity = currentDensity;
        prevDensity = currentDensity;
      }

      const currentMaxDrops = maxDropsSignal();
      if (currentMaxDrops !== prevMaxDrops) {
        uniformGroup.uniforms.uMaxFlakes = currentMaxDrops;
        prevMaxDrops = currentMaxDrops;
      }
    } else if (effectSignal() === 'fog' || effectSignal() === 'cloud') {
      // Only update fog-specific uniforms if they changed
      const currentSpeed = speedSignal();
      if (currentSpeed !== prevSpeed) {
        uniformGroup.uniforms.uSpeed = currentSpeed;
        prevSpeed = currentSpeed;
      }

      const currentScale = scaleSignal();
      if (currentScale !== prevScale) {
        uniformGroup.uniforms.uScale = currentScale;
        prevScale = currentScale;
      }

      const currentDensity = densitySignal();
      if (currentDensity !== prevDensity) {
        uniformGroup.uniforms.uDensity = currentDensity;
        prevDensity = currentDensity;
      }

      const currentHeight = normalizeHeightValue(heightSignal());
      if (currentHeight !== prevHeight) {
        uniformGroup.uniforms.uHeight = currentHeight;
        prevHeight = currentHeight;
      }

      if (effectSignal() === 'cloud') {
        const currentSunIntensity = normalizeSunIntensityValue(sunIntensitySignal());
        if (currentSunIntensity !== prevSunIntensity) {
          uniformGroup.uniforms.uSunIntensity = currentSunIntensity;
          prevSunIntensity = currentSunIntensity;
        }

        const currentSunAngle = normalizeSunAngleValue(sunAngleSignal());
        if (currentSunAngle !== prevSunAngle) {
          uniformGroup.uniforms.uSunDirection = sunDirectionFromAngle(currentSunAngle);
          prevSunAngle = currentSunAngle;
        }

        const currentRaySpread = normalizeRaySpreadValue(raySpreadSignal());
        if (currentRaySpread !== prevRaySpread) {
          uniformGroup.uniforms.uRaySpread = currentRaySpread;
          prevRaySpread = currentRaySpread;
        }

        const currentRayTwinkle = normalizeRayTwinkleValue(rayTwinkleSignal());
        if (currentRayTwinkle !== prevRayTwinkle) {
          uniformGroup.uniforms.uRayTwinkle = currentRayTwinkle;
          prevRayTwinkle = currentRayTwinkle;
        }

        const currentRayTwinkleSpeed = normalizeRayTwinkleSpeedValue(rayTwinkleSpeedSignal());
        if (currentRayTwinkleSpeed !== prevRayTwinkleSpeed) {
          uniformGroup.uniforms.uRayTwinkleSpeed = currentRayTwinkleSpeed;
          prevRayTwinkleSpeed = currentRayTwinkleSpeed;
        }
      }
    }
  });

  return h(Mesh, {
    ...meshProps,
    geometry,
    shader,
    width: viewWidth,
    height: viewHeight,
    x: originX,
    y: originY,
  });
};

export const Weather = WeatherEffect;
