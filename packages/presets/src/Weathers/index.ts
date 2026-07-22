import {
  Container,
  createComponent,
  DisplayObject,
  tick,
  useProps,
  h,
  Mesh,
  registerComponent,
  signal,
  mount,
  effect as watchEffect,
} from "canvasengine";
import {
  Container as PixiContainer,
  Geometry,
  Graphics as PixiGraphics,
  Shader,
  TilingSprite as PixiTilingSprite,
  Texture,
  UniformGroup,
} from "pixi.js";
import { createSnowShader } from "./snow";
import { createFogShader, createCloudShader } from "./fog";

const rainTextures = new Map<number, Texture>();

const resolveValue = (value: any) => (typeof value === "function" ? value() : value);

type RainSplash = {
  x: number;
  y: number;
  age: number;
  life: number;
  radius: number;
  delay: number;
};

function seededRandom(seed: number) {
  let value = seed * 9301 + 49297;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function createRainTexture(seed = 1): Texture {
  if (rainTextures.has(seed)) return rainTextures.get(seed)!;
  if (typeof document === "undefined") return Texture.WHITE;

  const random = seededRandom(seed);
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) return Texture.WHITE;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";

  for (let i = 0; i < 62; i++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const length = 18 + random() * 24;
    const slant = 4 + random() * 8;
    const alpha = 0.2 + random() * 0.22;
    const lineWidth = random() > 0.76 ? 1.9 : 1.15;
    const gradient = context.createLinearGradient(x, y, x + slant, y + length);

    gradient.addColorStop(0, "rgba(220,235,255,0)");
    gradient.addColorStop(0.28, `rgba(220,235,255,${alpha})`);
    gradient.addColorStop(0.72, `rgba(235,245,255,${alpha * 0.86})`);
    gradient.addColorStop(1, "rgba(220,235,255,0)");

    context.strokeStyle = gradient;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + slant, y + length);
    context.stroke();
  }

  const texture = Texture.from(canvas);
  rainTextures.set(seed, texture);
  return texture;
}

class RainTextureLayer extends DisplayObject(PixiTilingSprite) {
  private tickSubscription: any;
  private widthInput = 1000;
  private heightInput = 1000;
  private speedInput = 1;
  private windInput = 0;
  private windStrengthInput = 0;
  private fallScaleInput = 1;
  private densityInput = 120;
  private maxDropsInput = 80;
  private topDownInput = true;
  private topDownTileScale = { x: 1, y: 1 };
  private sideTileScale = { x: 1, y: 1 };
  private topDownAlpha = 0.5;
  private sideAlpha = 0.4;
  private offsetX = 0;
  private offsetY = 0;

  onUpdate(props: any) {
    super.onUpdate(props);
    if (props.texture) this.texture = props.texture;
    if (props.topDownTileScale) this.topDownTileScale = props.topDownTileScale;
    if (props.sideTileScale) this.sideTileScale = props.sideTileScale;
    if (props.topDownAlpha !== undefined) this.topDownAlpha = props.topDownAlpha;
    if (props.sideAlpha !== undefined) this.sideAlpha = props.sideAlpha;
    if (props.startX !== undefined) this.offsetX = props.startX;
    if (props.startY !== undefined) this.offsetY = props.startY;
    if (props.speed !== undefined) this.speedInput = props.speed;
    if (props.windDirection !== undefined) this.windInput = props.windDirection;
    if (props.windStrength !== undefined) this.windStrengthInput = props.windStrength;
    if (props.fallScale !== undefined) this.fallScaleInput = props.fallScale;
    if (props.density !== undefined) this.densityInput = props.density;
    if (props.maxDrops !== undefined) this.maxDropsInput = props.maxDrops;
    if (props.topDown !== undefined) this.topDownInput = props.topDown;
    if (props.width !== undefined) {
      this.widthInput = props.width;
      this.width = Number(resolveValue(props.width)) || this.width;
    }
    if (props.height !== undefined) {
      this.heightInput = props.height;
      this.height = Number(resolveValue(props.height)) || this.height;
    }
  }

  async onMount(element: any, index?: number) {
    await super.onMount(element, index);
    this.widthInput = element.propObservables?.width ?? element.props.width ?? this.widthInput;
    this.heightInput = element.propObservables?.height ?? element.props.height ?? this.heightInput;
    this.speedInput = element.propObservables?.speed ?? element.props.speed ?? this.speedInput;
    this.windInput = element.propObservables?.windDirection ?? element.props.windDirection ?? this.windInput;
    this.windStrengthInput = element.propObservables?.windStrength ?? element.props.windStrength ?? this.windStrengthInput;
    this.densityInput = element.propObservables?.density ?? element.props.density ?? this.densityInput;
    this.maxDropsInput = element.propObservables?.maxDrops ?? element.props.maxDrops ?? this.maxDropsInput;
    this.topDownInput = element.propObservables?.topDown ?? element.props.topDown ?? this.topDownInput;
    this.tickSubscription = element.props.context?.tick?.observable?.subscribe(({ value }: any) => {
      const delta = Math.min(value?.deltaTime ?? 16.67, 50) / 16.67;
      const speed = Number(resolveValue(this.speedInput)) || 0;
      const windDirection = Number(resolveValue(this.windInput)) || 0;
      const windStrength = Number(resolveValue(this.windStrengthInput)) || 0;
      const fallScale = Number(resolveValue(this.fallScaleInput)) || 1;
      const density = Number(resolveValue(this.densityInput)) || 120;
      const maxDrops = Number(resolveValue(this.maxDropsInput)) || 80;
      const topDown = resolveValue(this.topDownInput) !== false && resolveValue(this.topDownInput) !== 0;
      const width = Number(resolveValue(this.widthInput)) || this.width;
      const height = Number(resolveValue(this.heightInput)) || this.height;
      const dropFactor = Math.min(Math.max(maxDrops / 100, 0.45), 1.65);
      const intensity = Math.min(Math.max((density / 180) * dropFactor, 0.35), 1.55);
      const tileScale = topDown ? this.topDownTileScale : this.sideTileScale;
      const fall = (7.2 + speed * 4.8) * fallScale * delta;
      const drift = windDirection * windStrength * 3.8 * delta;

      this.width = width;
      this.height = height;
      this.alpha = (topDown ? this.topDownAlpha : this.sideAlpha) * intensity;
      this.tileScale.set(tileScale.x, tileScale.y);
      this.offsetX += drift + fall * 0.12;
      this.offsetY += fall;
      this.tilePosition.set(this.offsetX, this.offsetY);
    });
  }

  async onDestroy(parent: any, afterDestroy: any) {
    this.tickSubscription?.unsubscribe?.();
    await super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("RainTextureLayer", RainTextureLayer);

const RainLayer = (props: any) => createComponent("RainTextureLayer", props);

class RainImpactLayer extends DisplayObject(PixiContainer) {
  private tickSubscription: any;
  private graphics = new PixiGraphics();
  private widthInput = 1000;
  private heightInput = 1000;
  private speedInput = 1;
  private densityInput = 120;
  private maxDropsInput = 80;
  private topDownInput = true;
  private windInput = 0;
  private windStrengthInput = 0;
  private lastTopDown: boolean | null = null;
  private splashes: RainSplash[] = [];

  onUpdate(props: any) {
    super.onUpdate(props);
    if (props.width !== undefined) {
      this.widthInput = props.width;
      this.width = Number(resolveValue(props.width)) || this.width;
    }
    if (props.height !== undefined) {
      this.heightInput = props.height;
      this.height = Number(resolveValue(props.height)) || this.height;
    }
    if (props.speed !== undefined) this.speedInput = props.speed;
    if (props.density !== undefined) this.densityInput = props.density;
    if (props.maxDrops !== undefined) this.maxDropsInput = props.maxDrops;
    if (props.topDown !== undefined) this.topDownInput = props.topDown;
    if (props.windDirection !== undefined) this.windInput = props.windDirection;
    if (props.windStrength !== undefined) this.windStrengthInput = props.windStrength;
  }

  async onMount(element: any, index?: number) {
    await super.onMount(element, index);
    this.addChild(this.graphics);
    this.widthInput = element.propObservables?.width ?? element.props.width ?? this.widthInput;
    this.heightInput = element.propObservables?.height ?? element.props.height ?? this.heightInput;
    this.speedInput = element.propObservables?.speed ?? element.props.speed ?? this.speedInput;
    this.densityInput = element.propObservables?.density ?? element.props.density ?? this.densityInput;
    this.maxDropsInput = element.propObservables?.maxDrops ?? element.props.maxDrops ?? this.maxDropsInput;
    this.topDownInput = element.propObservables?.topDown ?? element.props.topDown ?? this.topDownInput;
    this.windInput = element.propObservables?.windDirection ?? element.props.windDirection ?? this.windInput;
    this.windStrengthInput = element.propObservables?.windStrength ?? element.props.windStrength ?? this.windStrengthInput;

    this.tickSubscription = element.props.context?.tick?.observable?.subscribe(({ value }: any) => {
      const delta = Math.min(value?.deltaTime ?? 16.67, 50) / 16.67;
      this.drawImpacts(delta);
    });
  }

  private numberValue(input: any, fallback: number) {
    const value = Number(resolveValue(input));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private booleanValue(input: any) {
    const value = resolveValue(input);
    return value !== false && value !== 0;
  }

  private resetSplash(splash: RainSplash, width: number, height: number, topDown: boolean, warm = false) {
    splash.x = Math.random() * width;
    splash.y = topDown
      ? height * (0.12 + Math.random() * 0.78)
      : height * (0.78 + Math.random() * 0.12);
    splash.life = 0.24 + Math.random() * 0.22;
    splash.radius = topDown ? 2.2 + Math.random() * 3.2 : 3.4 + Math.random() * 4.4;
    splash.delay = 0.12 + Math.random() * 0.55;
    splash.age = warm ? Math.random() * splash.life : -Math.random() * splash.delay;
  }

  private ensureSplashCount(count: number, width: number, height: number, topDown: boolean) {
    while (this.splashes.length < count) {
      const splash = { x: 0, y: 0, age: 0, life: 0.35, radius: 3, delay: 0.25 };
      this.resetSplash(splash, width, height, topDown, true);
      this.splashes.push(splash);
    }
    if (this.splashes.length > count) {
      this.splashes.length = count;
    }
  }

  private drawImpacts(delta: number) {
    const width = this.numberValue(this.widthInput, 1000);
    const height = this.numberValue(this.heightInput, 1000);
    const speed = this.numberValue(this.speedInput, 1);
    const density = this.numberValue(this.densityInput, 120);
    const maxDrops = this.numberValue(this.maxDropsInput, 80);
    const topDown = this.booleanValue(this.topDownInput);
    const windDirection = Number(resolveValue(this.windInput)) || 0;
    const windStrength = Number(resolveValue(this.windStrengthInput)) || 0;
    const intensity = Math.min(Math.max(density / 180, 0.45), 1.55);
    const count = Math.min(Math.round(maxDrops), Math.round((topDown ? 54 : 34) * intensity));
    const g = this.graphics;

    if (this.lastTopDown !== topDown) {
      this.splashes.length = 0;
      this.lastTopDown = topDown;
    }

    this.alpha = topDown ? 0.9 : 0.82;
    this.ensureSplashCount(count, width, height, topDown);
    g.clear();

    for (const splash of this.splashes) {
      splash.age += (0.045 + speed * 0.018) * delta;
      if (splash.age > splash.life) {
        this.resetSplash(splash, width, height, topDown);
        continue;
      }
      if (splash.age < 0) continue;

      const phase = splash.age / splash.life;
      const fade = Math.pow(1 - phase, 1.7) * intensity;
      const spread = splash.radius * (0.65 + phase * 2.6);
      const yLift = topDown ? phase * 0.8 : phase * 1.6;
      const drift = windDirection * windStrength * 7 * phase;
      const x = splash.x + drift;
      const y = splash.y - yLift;
      const alpha = Math.min(0.62, 0.44 * fade);

      g.ellipse(x, y, spread, splash.radius * (0.18 + phase * 0.16))
        .stroke({ color: 0xcfe9ff, alpha, width: topDown ? 1.15 : 1.35 });

      g.moveTo(x - spread * 1.15, y - 0.4)
        .lineTo(x - spread * 0.35, y - splash.radius * 0.24)
        .stroke({ color: 0xe5f6ff, alpha: alpha * 0.78, width: 1 });

      g.moveTo(x + spread * 0.35, y - splash.radius * 0.24)
        .lineTo(x + spread * 1.15, y - 0.4)
        .stroke({ color: 0xe5f6ff, alpha: alpha * 0.78, width: 1 });
    }
  }

  async onDestroy(parent: any, afterDestroy: any) {
    this.tickSubscription?.unsubscribe?.();
    await super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("RainImpactLayer", RainImpactLayer);

const RainImpacts = (props: any) => createComponent("RainImpactLayer", props);

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
  lightClouds: { effect: "cloud", speed: 0.16, density: 0.58, height: 0.72, scale: 0.82, shadowIntensity: 0.42, shadowSoftness: 0.68, sunIntensity: 0.0, sunAngle: 0.84, raySpread: 0.92, rayTwinkle: 0.25, rayTwinkleSpeed: 0.9 },
  overcastClouds: { effect: "cloud", speed: 0.12, density: 0.95, height: 0.86, scale: 0.95, shadowIntensity: 0.48, shadowSoftness: 0.74, sunIntensity: 0.0, sunAngle: 0.95, raySpread: 1.15, rayTwinkle: 0.18, rayTwinkleSpeed: 0.7 },
  stormClouds: { effect: "cloud", speed: 0.2, density: 1.25, height: 0.94, scale: 1.15, shadowIntensity: 0.6, shadowSoftness: 0.52, sunIntensity: 0.0, sunAngle: 1.08, raySpread: 1.35, rayTwinkle: 0.12, rayTwinkleSpeed: 0.6 },
  goldenHourRays: { effect: "cloud", speed: 0.14, density: 0.72, height: 0.82, scale: 0.88, shadowIntensity: 0.4, shadowSoftness: 0.62, sunIntensity: 0.75, sunAngle: 0.72, raySpread: 0.78, rayTwinkle: 0.78, rayTwinkleSpeed: 1.4 },
  sunnySoftRays: { effect: "cloud", speed: 0.13, density: 0.62, height: 0.76, scale: 0.78, shadowIntensity: 0.32, shadowSoftness: 0.76, sunIntensity: 0.45, sunAngle: 0.8, raySpread: 0.95, rayTwinkle: 0.35, rayTwinkleSpeed: 0.95 },
  sunsetTwinkleRays: { effect: "cloud", speed: 0.1, density: 0.74, height: 0.84, scale: 0.9, shadowIntensity: 0.42, shadowSoftness: 0.64, sunIntensity: 0.8, sunAngle: 0.64, raySpread: 0.8, rayTwinkle: 1.0, rayTwinkleSpeed: 1.6 },
  dramaticCrepuscularRays: { effect: "cloud", speed: 0.11, density: 0.9, height: 0.9, scale: 1.0, shadowIntensity: 0.52, shadowSoftness: 0.48, sunIntensity: 0.95, sunAngle: 0.7, raySpread: 0.68, rayTwinkle: 0.6, rayTwinkleSpeed: 1.2 },
  morningHazeRays: { effect: "cloud", speed: 0.09, density: 0.55, height: 0.7, scale: 0.74, shadowIntensity: 0.3, shadowSoftness: 0.82, sunIntensity: 0.3, sunAngle: 0.9, raySpread: 1.05, rayTwinkle: 0.42, rayTwinkleSpeed: 0.8 },
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
export const WeatherEffect = (options: any) => {
  const {
    effect: effectType = signal('rain'),
    speed = signal(0.5),
    windDirection = signal(0.0),
    windStrength = signal(0.2),
    density = signal(120.0),  // Reduced default density for better performance
    maxDrops = signal(80.0),  // Reduced default maxDrops for better performance
    topDown = signal(true),  // Full-screen rain tuned for top-down maps by default
    height = signal(1.0),  // Fog/cloud height parameter (0 = bottom, 1 = full)
    scale = signal(2.0),  // Fog noise scale parameter
    shadowIntensity = signal(0.38),  // Cloud shadow opacity on the ground
    shadowSoftness = signal(0.65),  // Cloud shadow edge softness
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
  let viewportRef: any;
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
  const topDownSignal =
    typeof topDown === "function" ? topDown : signal(topDown);
  const heightSignal =
    typeof height === "function" ? height : signal(height);
  const scaleSignal =
    typeof scale === "function" ? scale : signal(scale);
  const shadowIntensitySignal =
    typeof shadowIntensity === "function" ? shadowIntensity : signal(shadowIntensity);
  const shadowSoftnessSignal =
    typeof shadowSoftness === "function" ? shadowSoftness : signal(shadowSoftness);
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

  const normalizeHeightValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) ? value : 1.0;
  const normalizeSunIntensityValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0.85;
  const normalizeShadowIntensityValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.65) : 0.38;
  const normalizeShadowSoftnessValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0.65;
  const normalizeSunAngleValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0.85;
  const normalizeRaySpreadValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1.0;
  const normalizeRayTwinkleValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0.45;
  const normalizeRayTwinkleSpeedValue = (value: any) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1.0;
  const normalizeTopDownValue = (value: any) =>
    value === false || value === 0 ? 0 : 1;
  const sunDirectionFromAngle = (angle: number) => [Math.cos(angle), Math.sin(angle)];
  const normalizeResolutionValue = (value: any) => {
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

  if (effectSignal() === 'rain') {
    return h(Container, {
      ...meshProps,
      width: viewWidth,
      height: viewHeight,
      x: originX,
      y: originY,
    },
      h(RainLayer, {
        texture: createRainTexture(11),
        width: viewWidth,
        height: viewHeight,
        speed: speedSignal,
        windDirection: windDirectionSignal,
        windStrength: windStrengthSignal,
        density: densitySignal,
        maxDrops: maxDropsSignal,
        topDown: topDownSignal,
        fallScale: 1.08,
        topDownTileScale: { x: 0.92, y: 0.92 },
        sideTileScale: { x: 1.08, y: 1.18 },
        topDownAlpha: 0.58,
        sideAlpha: 0.48,
        blendMode: "screen",
        startX: 0,
        startY: 0,
      }),
      h(RainLayer, {
        texture: createRainTexture(29),
        width: viewWidth,
        height: viewHeight,
        speed: speedSignal,
        windDirection: windDirectionSignal,
        windStrength: windStrengthSignal,
        density: densitySignal,
        maxDrops: maxDropsSignal,
        topDown: topDownSignal,
        fallScale: 0.82,
        topDownTileScale: { x: 1.25, y: 1.25 },
        sideTileScale: { x: 1.42, y: 1.55 },
        topDownAlpha: 0.38,
        sideAlpha: 0.3,
        blendMode: "screen",
        startX: 53,
        startY: 37,
      }),
      h(RainLayer, {
        texture: createRainTexture(47),
        width: viewWidth,
        height: viewHeight,
        speed: speedSignal,
        windDirection: windDirectionSignal,
        windStrength: windStrengthSignal,
        density: densitySignal,
        maxDrops: maxDropsSignal,
        topDown: topDownSignal,
        fallScale: 0.64,
        topDownTileScale: { x: 1.7, y: 1.7 },
        sideTileScale: { x: 1.9, y: 2.1 },
        topDownAlpha: 0.24,
        sideAlpha: 0.18,
        blendMode: "screen",
        startX: 101,
        startY: 73,
      }),
      h(RainImpacts, {
        width: viewWidth,
        height: viewHeight,
        speed: speedSignal,
        density: densitySignal,
        maxDrops: maxDropsSignal,
        topDown: topDownSignal,
        windDirection: windDirectionSignal,
        windStrength: windStrengthSignal,
        blendMode: "screen",
      })
    );
  }

  let glProgram;
  let uniformConfig;

  if (effectSignal() === 'snow') {
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
      uShadowIntensity: { value: normalizeShadowIntensityValue(shadowIntensitySignal()), type: "f32" },
      uShadowSoftness: { value: normalizeShadowSoftnessValue(shadowSoftnessSignal()), type: "f32" },
      uSunIntensity: { value: normalizeSunIntensityValue(sunIntensitySignal()), type: "f32" },
      uSunDirection: { value: sunDirectionFromAngle(initialSunAngle), type: "vec2<f32>" },
      uRaySpread: { value: normalizeRaySpreadValue(raySpreadSignal()), type: "f32" },
      uRayTwinkle: { value: normalizeRayTwinkleValue(rayTwinkleSignal()), type: "f32" },
      uRayTwinkleSpeed: { value: normalizeRayTwinkleSpeedValue(rayTwinkleSpeedSignal()), type: "f32" },
    };
  } else {
    throw new Error(`Unknown weather effect: ${effectSignal()}. Supported: rain, snow, fog, cloud`);
  }

  const uniformGroup = new UniformGroup(uniformConfig as any);

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
  let prevTopDown = normalizeTopDownValue(topDownSignal());
  let prevHeight = heightSignal();
  let prevScale = scaleSignal();
  let prevSunIntensity = normalizeSunIntensityValue(sunIntensitySignal());
  let prevShadowIntensity = normalizeShadowIntensityValue(shadowIntensitySignal());
  let prevShadowSoftness = normalizeShadowSoftnessValue(shadowSoftnessSignal());
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

      const currentTopDown = normalizeTopDownValue(topDownSignal());
      if (currentTopDown !== prevTopDown) {
        uniformGroup.uniforms.uRainTopDown = currentTopDown;
        prevTopDown = currentTopDown;
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
        const currentShadowIntensity = normalizeShadowIntensityValue(shadowIntensitySignal());
        if (currentShadowIntensity !== prevShadowIntensity) {
          uniformGroup.uniforms.uShadowIntensity = currentShadowIntensity;
          prevShadowIntensity = currentShadowIntensity;
        }

        const currentShadowSoftness = normalizeShadowSoftnessValue(shadowSoftnessSignal());
        if (currentShadowSoftness !== prevShadowSoftness) {
          uniformGroup.uniforms.uShadowSoftness = currentShadowSoftness;
          prevShadowSoftness = currentShadowSoftness;
        }

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
