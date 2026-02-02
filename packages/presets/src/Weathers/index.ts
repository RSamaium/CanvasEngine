import {
  tick,
  useProps,
  h,
  Mesh,
  signal,
  mount,
  effect,
} from "canvasengine";
import { Geometry, Shader, UniformGroup } from "pixi.js";
import { createRainShader } from "./rain";
import { createSnowShader } from "./snow";
import { createFogShader, createCloudShader } from "./fog";


/**
 * Weather Effect Component (optimized)
 */
export const WeatherEffect = (options) => {
  const {
    effect = signal('rain'),
    speed = signal(0.5),
    windDirection = signal(0.0),
    windStrength = signal(0.2),
    density = signal(120.0),  // Reduced default density for better performance
    maxDrops = signal(80.0),  // Reduced default maxDrops for better performance
    height = signal(1.0),  // Fog/cloud height parameter (0 = bottom, 1 = full)
    scale = signal(2.0),  // Fog noise scale parameter
    resolution,
  } = useProps(options);

  // Auto-detect resolution from canvas if not provided
  const defaultResolution = signal([1000, 1000]);
  const viewWidth = signal(0);
  const viewHeight = signal(0);
  const originX = signal(0);
  const originY = signal(0);
  let viewportRef;
  const resolutionSignal = resolution
    ? (typeof resolution === "function" ? resolution : signal(resolution))
    : defaultResolution;

  // Try to get canvas size from context if available
  mount((element) => {
    const context = element.props.context;
    viewportRef = context?.viewport;
    if (viewportRef?.getVisibleBounds) {
      const bounds = viewportRef.getVisibleBounds();
      if (bounds) {
        defaultResolution.set([bounds.width, bounds.height]);
        viewWidth.set(bounds.width);
        viewHeight.set(bounds.height);
        originX.set(bounds.x);
        originY.set(bounds.y);
      }
    }
    if (context?.canvasSize) {
      effect(() => {
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

  const normalizeHeightValue = (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : 1.0;

  let glProgram;
  let uniformConfig;

  if (effect() === 'rain') {
    glProgram = createRainShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
      uRainSpeed: { value: speedSignal(), type: "f32" },
      uWindDirection: { value: windDirectionSignal(), type: "f32" },
      uWindStrength: { value: windStrengthSignal(), type: "f32" },
      uRainDensity: { value: densitySignal(), type: "f32" },
      uMaxDrops: { value: maxDropsSignal(), type: "f32" },
    };
  } else if (effect() === 'snow') {
    glProgram = createSnowShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
      uSnowSpeed: { value: speedSignal(), type: "f32" },
      uWindDirection: { value: windDirectionSignal(), type: "f32" },
      uWindStrength: { value: windStrengthSignal(), type: "f32" },
      uSnowDensity: { value: densitySignal(), type: "f32" },
      uMaxFlakes: { value: maxDropsSignal(), type: "f32" },
    };
  } else if (effect() === 'fog') {
    glProgram = createFogShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
      uSpeed: { value: speedSignal(), type: "f32" },
      uScale: { value: scaleSignal(), type: "f32" },
      uDensity: { value: densitySignal(), type: "f32" },
      uHeight: { value: normalizeHeightValue(heightSignal()), type: "f32" },
    };
  } else if (effect() === 'cloud') {
    glProgram = createCloudShader();
    uniformConfig = {
      uTime: { value: 0, type: "f32" },
      uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
      uSpeed: { value: speedSignal(), type: "f32" },
      uScale: { value: scaleSignal(), type: "f32" },
      uDensity: { value: densitySignal(), type: "f32" },
      uHeight: { value: normalizeHeightValue(heightSignal()), type: "f32" },
    };
  } else {
    throw new Error(`Unknown weather effect: ${effect()}. Supported: rain, snow, fog, cloud`);
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
  let prevResolution = [...resolutionSignal()];
  let prevWindDirection = windDirectionSignal();
  let prevWindStrength = windStrengthSignal();
  let prevSpeed = speedSignal();
  let prevDensity = densitySignal();
  let prevMaxDrops = maxDropsSignal();
  let prevHeight = heightSignal();
  let prevScale = scaleSignal();

  tick(({ deltaTime }) => {
    if (viewportRef?.getVisibleBounds) {
      const bounds = viewportRef.getVisibleBounds();
      if (bounds) {
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
    const currentResolution = resolutionSignal();
    if (currentResolution[0] !== prevResolution[0] || currentResolution[1] !== prevResolution[1]) {
      uniformGroup.uniforms.uResolution = currentResolution;
      prevResolution = [...currentResolution];
    }

    // Only update wind if it changed
    const currentWindDirection = windDirectionSignal();
    if (currentWindDirection !== prevWindDirection) {
      uniformGroup.uniforms.uWindDirection = currentWindDirection;
      prevWindDirection = currentWindDirection;
    }

    // Update wind strength only for rain and snow (fog doesn't use it)
    if (effect() === 'rain' || effect() === 'snow') {
      const currentWindStrength = windStrengthSignal();
      if (currentWindStrength !== prevWindStrength) {
        uniformGroup.uniforms.uWindStrength = currentWindStrength;
        prevWindStrength = currentWindStrength;
      }
    }

    if (effect() === 'rain') {
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
    } else if (effect() === 'snow') {
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
    } else if (effect() === 'fog' || effect() === 'cloud') {
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
    }
  });

  return h(Mesh, {
    geometry,
    shader,
    width: viewWidth,
    height: viewHeight,
    x: originX,
    y: originY,
  });
};

export const Weather = WeatherEffect;
