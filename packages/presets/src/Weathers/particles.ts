import { Container, Graphics, Sprite, Texture } from "pixi.js";

export type WeatherParticleEffect =
  | "embers"
  | "ash"
  | "leaves"
  | "petals"
  | "fireflies"
  | "spores"
  | "sand";

export const WEATHER_PARTICLE_EFFECTS: WeatherParticleEffect[] = [
  "embers",
  "ash",
  "leaves",
  "petals",
  "fireflies",
  "spores",
  "sand",
];

export function isWeatherParticleEffect(value: unknown): value is WeatherParticleEffect {
  return WEATHER_PARTICLE_EFFECTS.includes(value as WeatherParticleEffect);
}

type Range = [number, number];

interface WeatherParticleStyle {
  textures: () => Texture[];
  colors: string[];
  blendMode: "normal" | "add";
  /** Sprite scale. */
  size: Range;
  /** Vertical speed in px/s at `speed = 0.5`. Negative values rise. */
  fall: Range;
  /** Horizontal speed in px/s, following the wind direction. */
  drift?: number;
  sway?: Range;
  swayFrequency?: Range;
  /** Degrees per second. */
  spin?: Range;
  /** 3D flip speed in rad/s (leaves, petals, ash). */
  tumble?: Range;
  alpha: Range;
  /** Lifetime in seconds. Particles fade in/out and respawn instead of wrapping forever. */
  life?: Range;
  flicker?: number;
  /** Glow period in seconds (fireflies). */
  pulse?: Range;
  /** Random walk speed in px/s. */
  wander?: number;
  alignToMotion?: boolean;
  /** Tint reached at the end of the particle life (cooling embers). */
  endColor?: string;
  haze?: { color: string; alpha: number };
  /** Particles per 1280x720 area at `density = 100`. */
  densityScale: number;
}

export interface WeatherParticleParams {
  width: number;
  height: number;
  cameraX?: number;
  cameraY?: number;
  speed?: number;
  windDirection?: number;
  windStrength?: number;
  density?: number;
  maxDrops?: number;
  colors?: (string | number)[];
  particleSize?: number;
  haze?: number;
}

interface WeatherParticle {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  scale: number;
  baseAlpha: number;
  color: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  spin: number;
  tumble: number;
  tumblePhase: number;
  pulsePeriod: number;
  pulsePhase: number;
  flickerPhase: number;
  flickerSpeed: number;
  life: number;
  age: number;
}

const textureCache = new Map<string, Texture[]>();

function cachedTextures(key: string, draw: (index: number) => HTMLCanvasElement | null, count = 1): Texture[] {
  if (textureCache.has(key)) return textureCache.get(key)!;
  if (typeof document === "undefined") return [Texture.WHITE];
  const textures: Texture[] = [];
  for (let i = 0; i < count; i++) {
    const canvas = draw(i);
    textures.push(canvas ? Texture.from(canvas) : Texture.WHITE);
  }
  textureCache.set(key, textures);
  return textures;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  return context ? { canvas, context } : null;
}

const glowTextures = () =>
  cachedTextures("glow", () => {
    const target = createCanvas(32, 32);
    if (!target) return null;
    const { canvas, context } = target;
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.18, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.32)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    return canvas;
  });

const ashTextures = () =>
  cachedTextures(
    "ash",
    (index) => {
      const target = createCanvas(16, 16);
      if (!target) return null;
      const { canvas, context } = target;
      const points = [
        [[3, 5], [10, 2], [14, 8], [9, 14], [2, 11]],
        [[2, 7], [7, 3], [13, 4], [12, 12], [5, 13]],
        [[4, 3], [13, 6], [11, 13], [3, 10]],
      ][index];
      context.fillStyle = "rgba(255,255,255,0.92)";
      context.beginPath();
      points.forEach(([x, y], i) => (i === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
      context.closePath();
      context.fill();
      return canvas;
    },
    3
  );

const leafTextures = () =>
  cachedTextures(
    "leaf",
    (index) => {
      const target = createCanvas(32, 32);
      if (!target) return null;
      const { canvas, context } = target;
      const body = context.createLinearGradient(0, 0, 32, 32);
      body.addColorStop(0, "rgba(255,255,255,1)");
      body.addColorStop(1, "rgba(205,205,205,1)");
      context.fillStyle = body;
      context.beginPath();
      if (index === 0) {
        // Oval leaf
        context.moveTo(3, 16);
        context.bezierCurveTo(9, 4, 23, 4, 29, 16);
        context.bezierCurveTo(23, 28, 9, 28, 3, 16);
      } else if (index === 1) {
        // Maple-like lobed leaf
        const lobes = 5;
        for (let i = 0; i <= lobes * 2; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI) / lobes;
          const radius = i % 2 === 0 ? 14 : 6;
          const x = 16 + Math.cos(angle) * radius;
          const y = 17 + Math.sin(angle) * radius;
          if (i === 0) context.moveTo(x, y);
          else context.quadraticCurveTo(16 + Math.cos(angle - 0.3) * radius * 1.1, 17 + Math.sin(angle - 0.3) * radius * 1.1, x, y);
        }
      } else {
        // Long willow leaf
        context.moveTo(2, 18);
        context.bezierCurveTo(10, 8, 22, 8, 30, 12);
        context.bezierCurveTo(22, 20, 10, 22, 2, 18);
      }
      context.closePath();
      context.fill();
      context.strokeStyle = "rgba(90,90,90,0.55)";
      context.lineWidth = 1;
      context.beginPath();
      if (index === 1) {
        context.moveTo(16, 30);
        context.lineTo(16, 5);
      } else {
        context.moveTo(3, index === 0 ? 16 : 18);
        context.lineTo(29, index === 0 ? 16 : 12);
      }
      context.stroke();
      return canvas;
    },
    3
  );

const petalTextures = () =>
  cachedTextures(
    "petal",
    (index) => {
      const target = createCanvas(24, 24);
      if (!target) return null;
      const { canvas, context } = target;
      const gradient = context.createLinearGradient(12, 2, 12, 22);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(215,215,215,1)");
      context.fillStyle = gradient;
      context.beginPath();
      const notch = index === 0 ? 5 : 3;
      context.moveTo(12, 22);
      context.bezierCurveTo(2, 16, 3, 4, 8, 3);
      context.lineTo(12, 3 + notch);
      context.lineTo(16, 3);
      context.bezierCurveTo(21, 4, 22, 16, 12, 22);
      context.closePath();
      context.fill();
      return canvas;
    },
    2
  );

const sandTextures = () =>
  cachedTextures(
    "sand",
    (index) => {
      if (index === 0) {
        const target = createCanvas(32, 6);
        if (!target) return null;
        const { canvas, context } = target;
        const gradient = context.createLinearGradient(0, 0, 32, 0);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.7, "rgba(255,255,255,0.9)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 1.5, 32, 3);
        return canvas;
      }
      const target = createCanvas(8, 8);
      if (!target) return null;
      const { canvas, context } = target;
      const gradient = context.createRadialGradient(4, 4, 0, 4, 4, 4);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 8, 8);
      return canvas;
    },
    2
  );

export const WEATHER_PARTICLE_STYLES: Record<WeatherParticleEffect, WeatherParticleStyle> = {
  embers: {
    textures: glowTextures,
    colors: ["#ffe29a", "#ffb347", "#ff8a2b", "#ff5a1f"],
    endColor: "#b3200f",
    blendMode: "add",
    size: [0.35, 0.9],
    fall: [-70, -25],
    sway: [6, 22],
    swayFrequency: [0.6, 1.8],
    alpha: [0.7, 1],
    life: [1.8, 4.5],
    flicker: 0.5,
    haze: { color: "#ff4a12", alpha: 0.08 },
    densityScale: 1.1,
  },
  ash: {
    textures: ashTextures,
    colors: ["#c9c3bd", "#9a948f", "#e2ddd8", "#6e6965"],
    blendMode: "normal",
    size: [0.55, 1.2],
    fall: [16, 42],
    sway: [10, 32],
    swayFrequency: [0.3, 0.9],
    spin: [-90, 90],
    tumble: [1, 3],
    alpha: [0.45, 0.85],
    haze: { color: "#4a4440", alpha: 0.18 },
    densityScale: 1,
  },
  leaves: {
    textures: leafTextures,
    colors: ["#d9622b", "#e8a33d", "#b8431f", "#c9882a", "#8f3a1c", "#e5c14a"],
    blendMode: "normal",
    size: [0.45, 0.9],
    fall: [28, 64],
    drift: 18,
    sway: [22, 58],
    swayFrequency: [0.35, 1],
    spin: [-110, 110],
    tumble: [1.4, 3.8],
    alpha: [0.88, 1],
    densityScale: 0.6,
  },
  petals: {
    textures: petalTextures,
    colors: ["#ffd1dc", "#ffb7c9", "#ffe4ec", "#f7a1b8"],
    blendMode: "normal",
    size: [0.4, 0.75],
    fall: [20, 46],
    drift: 22,
    sway: [18, 46],
    swayFrequency: [0.4, 1.1],
    spin: [-140, 140],
    tumble: [1.8, 4.2],
    alpha: [0.85, 1],
    densityScale: 0.5,
  },
  fireflies: {
    textures: glowTextures,
    colors: ["#e8ff8a", "#c6ff5a", "#fff6a0"],
    blendMode: "add",
    size: [0.5, 0.95],
    fall: [-6, 6],
    sway: [4, 14],
    swayFrequency: [0.3, 0.8],
    alpha: [0.75, 1],
    pulse: [2, 5],
    wander: 22,
    densityScale: 0.7,
  },
  spores: {
    textures: glowTextures,
    colors: ["#9affe0", "#7fd6ff", "#c9a6ff"],
    blendMode: "add",
    size: [0.14, 0.4],
    fall: [-16, -4],
    sway: [8, 24],
    swayFrequency: [0.2, 0.6],
    alpha: [0.35, 0.8],
    life: [4, 8],
    pulse: [3, 6],
    wander: 8,
    densityScale: 0.6,
  },
  sand: {
    textures: sandTextures,
    colors: ["#e3c48f", "#d1a868", "#c19155", "#f0d9a8"],
    blendMode: "normal",
    size: [0.8, 1.9],
    fall: [-6, 22],
    drift: 320,
    sway: [2, 10],
    swayFrequency: [1, 3],
    alpha: [0.5, 0.95],
    alignToMotion: true,
    haze: { color: "#c9a36a", alpha: 0.2 },
    densityScale: 1.2,
  },
};

const REFERENCE_AREA = 1280 * 720;
const MARGIN = 48;

function toColorNumber(value: string | number) {
  if (typeof value === "number") return value;
  const hex = value.trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  return parseInt(full, 16);
}

function mixColor(start: number, end: number, progress: number) {
  const mix = (shift: number) =>
    Math.round(((start >> shift) & 255) + ((((end >> shift) & 255) - ((start >> shift) & 255)) * progress));
  return (mix(16) << 16) + (mix(8) << 8) + mix(0);
}

/**
 * Screen-sized ambient particle field (embers, leaves, fireflies...).
 * Particles live in the visible area, wrap around its edges and stay anchored to the
 * world when the camera moves (`cameraX` / `cameraY`).
 */
export class WeatherParticleField extends Container {
  readonly style: WeatherParticleStyle;
  private particles: WeatherParticle[] = [];
  private pool: Sprite[] = [];
  private hazeGraphics = new Graphics();
  private hazeKey = "";
  private lastCameraX: number | undefined;
  private lastCameraY: number | undefined;
  private random: () => number;
  private palette: number[] = [];
  private paletteKey = "";
  private time = 0;

  constructor(readonly effect: WeatherParticleEffect, random: () => number = Math.random) {
    super();
    this.style = WEATHER_PARTICLE_STYLES[effect];
    this.random = random;
    this.addChild(this.hazeGraphics);
  }

  get particleCount() {
    return this.particles.length;
  }

  update(deltaMs: number, params: WeatherParticleParams) {
    const seconds = Math.min(Math.max(deltaMs, 0), 50) / 1000;
    const width = Math.max(1, params.width);
    const height = Math.max(1, params.height);
    const style = this.style;
    this.time += seconds;

    this.updatePalette(params.colors);
    this.drawHaze(width, height, params.haze ?? 1);
    this.syncCount(this.targetCount(params, width, height), width, height, params.particleSize ?? 1);
    this.followCamera(params.cameraX ?? 0, params.cameraY ?? 0);

    const speed = Math.max(0.05, (params.speed ?? 0.5) * 2);
    const windDirection = params.windDirection ?? 0;
    const windStrength = params.windStrength ?? 0.2;
    const windSign = windDirection < 0 ? -1 : 1;
    const wind = windDirection * windStrength * 140 + (style.drift ?? 0) * windSign * (0.35 + windStrength);

    for (const particle of this.particles) {
      if (style.wander) {
        particle.vx += (this.random() - 0.5) * style.wander * 6 * seconds;
        particle.vy += (this.random() - 0.5) * style.wander * 6 * seconds;
        const velocity = Math.hypot(particle.vx, particle.vy);
        if (velocity > style.wander) {
          particle.vx *= style.wander / velocity;
          particle.vy *= style.wander / velocity;
        }
      }

      const moveX = (particle.vx + wind) * particle.depth * speed * seconds;
      const moveY = particle.vy * particle.depth * speed * seconds;
      particle.x += moveX;
      particle.y += moveY;
      particle.swayPhase += particle.swayFreq * Math.PI * 2 * seconds;
      particle.tumblePhase += particle.tumble * speed * seconds;
      particle.flickerPhase += particle.flickerSpeed * seconds;
      particle.pulsePhase += seconds;

      if (style.life) {
        particle.age += seconds;
        if (particle.age >= particle.life) {
          this.resetParticle(particle, width, height, params.particleSize ?? 1, "anywhere");
        }
      }
      this.wrap(particle, width, height, params.particleSize ?? 1);
      this.render(particle, moveX, moveY, seconds);
    }
  }

  private targetCount(params: WeatherParticleParams, width: number, height: number) {
    const density = Math.max(0, params.density ?? 100);
    const maxDrops = Math.max(0, params.maxDrops ?? 200);
    const area = (width * height) / REFERENCE_AREA;
    return Math.min(Math.round(maxDrops), Math.round(density * this.style.densityScale * area));
  }

  private updatePalette(colors?: (string | number)[]) {
    const source = colors?.length ? colors : this.style.colors;
    const key = source.join(",");
    if (key === this.paletteKey) return;
    this.paletteKey = key;
    this.palette = source.map(toColorNumber);
    for (const particle of this.particles) {
      particle.color = this.pick(this.palette);
    }
  }

  private drawHaze(width: number, height: number, amount: number) {
    const haze = this.style.haze;
    const key = `${width}x${height}:${amount}`;
    if (!haze || key === this.hazeKey) return;
    this.hazeKey = key;
    this.hazeGraphics.clear();
    if (amount <= 0) return;
    this.hazeGraphics
      .rect(0, 0, width, height)
      .fill({ color: toColorNumber(haze.color), alpha: Math.min(1, haze.alpha * amount) });
  }

  private followCamera(cameraX: number, cameraY: number) {
    if (this.lastCameraX !== undefined && this.lastCameraY !== undefined) {
      const dx = cameraX - this.lastCameraX;
      const dy = cameraY - this.lastCameraY;
      if (dx || dy) {
        for (const particle of this.particles) {
          particle.x -= dx * particle.depth;
          particle.y -= dy * particle.depth;
        }
      }
    }
    this.lastCameraX = cameraX;
    this.lastCameraY = cameraY;
  }

  private syncCount(count: number, width: number, height: number, sizeScale: number) {
    while (this.particles.length < count) {
      const sprite = this.pool.pop() ?? new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5);
      sprite.blendMode = this.style.blendMode as any;
      sprite.visible = true;
      this.addChild(sprite);
      const particle = { sprite } as WeatherParticle;
      this.resetParticle(particle, width, height, sizeScale, "anywhere");
      // spread lifetimes so the field does not pulse in sync
      particle.age = this.style.life ? this.random() * particle.life : 0;
      this.particles.push(particle);
    }
    while (this.particles.length > count) {
      const particle = this.particles.pop()!;
      this.removeChild(particle.sprite);
      particle.sprite.visible = false;
      this.pool.push(particle.sprite);
    }
  }

  private resetParticle(
    particle: WeatherParticle,
    width: number,
    height: number,
    sizeScale: number,
    placement: "anywhere" | "top" | "bottom"
  ) {
    const style = this.style;
    const textures = style.textures();
    const range = (value: Range | undefined, fallback = 0) =>
      value ? value[0] + (value[1] - value[0]) * this.random() : fallback;

    particle.sprite.texture = this.pick(textures);
    particle.depth = 0.6 + this.random() * 0.65;
    particle.x = -MARGIN + this.random() * (width + MARGIN * 2);
    particle.y =
      placement === "top"
        ? -MARGIN * this.random()
        : placement === "bottom"
          ? height + MARGIN * this.random()
          : -MARGIN + this.random() * (height + MARGIN * 2);
    particle.vx = 0;
    particle.vy = range(style.fall);
    particle.scale = range(style.size) * (0.7 + particle.depth * 0.45) * sizeScale;
    particle.baseAlpha = range(style.alpha) * (0.65 + particle.depth * 0.35);
    particle.color = this.pick(this.palette.length ? this.palette : style.colors.map(toColorNumber));
    particle.swayAmp = range(style.sway);
    particle.swayFreq = range(style.swayFrequency, 0.5);
    particle.swayPhase = this.random() * Math.PI * 2;
    particle.spin = (range(style.spin) * Math.PI) / 180;
    particle.tumble = range(style.tumble);
    particle.tumblePhase = this.random() * Math.PI * 2;
    particle.pulsePeriod = range(style.pulse, 1);
    particle.pulsePhase = this.random() * particle.pulsePeriod;
    particle.flickerPhase = this.random() * Math.PI * 2;
    particle.flickerSpeed = 6 + this.random() * 10;
    particle.life = range(style.life, Infinity);
    particle.age = 0;
    particle.sprite.rotation = this.random() * Math.PI * 2;
  }

  private wrap(particle: WeatherParticle, width: number, height: number, sizeScale: number) {
    const spanX = width + MARGIN * 2;
    const spanY = height + MARGIN * 2;
    if (particle.x < -MARGIN) particle.x += spanX;
    else if (particle.x > width + MARGIN) particle.x -= spanX;

    if (particle.y > height + MARGIN) {
      if (this.style.life) particle.y -= spanY;
      else this.resetParticle(particle, width, height, sizeScale, "top");
    } else if (particle.y < -MARGIN) {
      if (this.style.life || particle.vy >= 0) particle.y += spanY;
      else this.resetParticle(particle, width, height, sizeScale, "bottom");
    }
  }

  private render(particle: WeatherParticle, moveX: number, moveY: number, seconds: number) {
    const style = this.style;
    const sprite = particle.sprite;
    let alpha = particle.baseAlpha;
    let tint = particle.color;

    if (style.life) {
      const progress = particle.age / particle.life;
      alpha *= Math.min(1, progress / 0.15) * Math.min(1, (1 - progress) / 0.4);
      if (style.endColor) tint = mixColor(particle.color, toColorNumber(style.endColor), progress);
    }
    if (style.flicker) {
      alpha *= 1 - style.flicker * 0.5 * (1 + Math.sin(particle.flickerPhase));
    }
    if (style.pulse) {
      const wave = Math.sin((particle.pulsePhase / particle.pulsePeriod) * Math.PI * 2);
      alpha *= 0.12 + 0.88 * Math.pow(Math.max(0, wave), 2);
    }

    sprite.x = particle.x + Math.sin(particle.swayPhase) * particle.swayAmp;
    sprite.y = particle.y;
    sprite.alpha = Math.max(0, Math.min(1, alpha));
    sprite.tint = tint;

    if (style.alignToMotion) {
      if (moveX || moveY) sprite.rotation = Math.atan2(moveY, moveX);
      sprite.scale.set(particle.scale);
    } else {
      sprite.rotation += particle.spin * seconds;
      const flip = particle.tumble ? Math.cos(particle.tumblePhase) : 1;
      sprite.scale.set(particle.scale * flip, particle.scale);
    }
  }

  private pick<T>(values: T[]): T {
    return values[Math.floor(this.random() * values.length)] ?? values[0];
  }
}
