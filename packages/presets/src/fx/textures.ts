import { Assets, Texture } from "pixi.js";
import type { FxParticleConfig, FxShape } from "./types";

const shapeTextures = new Map<FxShape, Texture>();
const imageTextures = new Map<string, Promise<Texture> | Texture>();

const SHAPE_SIZES: Partial<Record<FxShape, [number, number]>> = {
  spark: [64, 16],
  ring: [64, 64],
  diamond: [48, 24],
  flare: [64, 64],
  flame: [48, 64],
  slash: [128, 128],
  streak: [128, 8],
  beam: [64, 256],
  sigil: [128, 128],
  prism: [128, 128],
};

export function getShapeTexture(shape: FxShape = "softCircle"): Texture {
  if (!shapeTextures.has(shape)) {
    shapeTextures.set(shape, createShapeTexture(shape));
  }
  return shapeTextures.get(shape)!;
}

function createShapeTexture(shape: FxShape): Texture {
  if (typeof document === "undefined") return Texture.WHITE;

  const canvas = document.createElement("canvas");
  const size = SHAPE_SIZES[shape] ?? [48, 48];
  canvas.width = size[0];
  canvas.height = size[1];
  const context = canvas.getContext("2d");
  if (!context) return Texture.WHITE;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ffffff";

  if (shape === "ring") {
    const gradient = context.createRadialGradient(32, 32, 14, 32, 32, 30);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,1)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.65)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else if (shape === "diamond") {
    // Elongated crystal pointing right, so `align: 'velocity'` works like `spark`.
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0.55)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(2, 12);
    context.lineTo(30, 3);
    context.lineTo(46, 12);
    context.lineTo(30, 21);
    context.closePath();
    context.fill();
  } else if (shape === "flare") {
    const glow = context.createRadialGradient(32, 32, 0, 32, 32, 14);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (const [x0, y0, x1, y1] of [[2, 32, 62, 32], [32, 2, 32, 62]]) {
      const ray = context.createLinearGradient(x0, y0, x1, y1);
      ray.addColorStop(0, "rgba(255,255,255,0)");
      ray.addColorStop(0.5, "rgba(255,255,255,1)");
      ray.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = ray;
      if (x0 === x1) context.fillRect(30.5, 2, 3, 60);
      else context.fillRect(2, 30.5, 60, 3);
    }
  } else if (shape === "flame") {
    const gradient = context.createRadialGradient(24, 42, 2, 24, 38, 24);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.8)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(24, 2);
    context.bezierCurveTo(30, 18, 42, 26, 42, 42);
    context.bezierCurveTo(42, 54, 33, 62, 24, 62);
    context.bezierCurveTo(15, 62, 6, 54, 6, 42);
    context.bezierCurveTo(6, 26, 18, 18, 24, 2);
    context.closePath();
    context.fill();
  } else if (shape === "bubble") {
    const body = context.createRadialGradient(24, 24, 10, 24, 24, 20);
    body.addColorStop(0, "rgba(255,255,255,0.12)");
    body.addColorStop(0.82, "rgba(255,255,255,0.45)");
    body.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = body;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(24, 24, 17, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(18, 17, 4, 0, Math.PI * 2);
    context.fill();
  } else if (shape === "slash") {
    // Crescent facing right: outer disc minus an offset inner disc.
    // Brightest on the outer edge, like a blade trail.
    const glow = context.createRadialGradient(30, 64, 30, 38, 64, 62);
    glow.addColorStop(0, "rgba(255,255,255,0)");
    glow.addColorStop(0.72, "rgba(255,255,255,0.55)");
    glow.addColorStop(0.93, "rgba(255,255,255,1)");
    glow.addColorStop(1, "rgba(255,255,255,0.2)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(38, 64, 60, -Math.PI / 2, Math.PI / 2);
    context.closePath();
    context.fill();
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(18, 64, 62, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "source-over";
  } else if (shape === "streak") {
    // Thin speed line pointing right, with a bright head.
    const gradient = context.createLinearGradient(0, 0, 128, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.75)");
    gradient.addColorStop(0.94, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, 4);
    context.lineTo(118, 1);
    context.lineTo(128, 4);
    context.lineTo(118, 7);
    context.closePath();
    context.fill();
  } else if (shape === "beam") {
    // Vertical light column fading toward the top: use anchor { x: 0.5, y: 1 }.
    const horizontal = context.createLinearGradient(0, 0, 64, 0);
    horizontal.addColorStop(0, "rgba(255,255,255,0)");
    horizontal.addColorStop(0.3, "rgba(255,255,255,0.45)");
    horizontal.addColorStop(0.5, "rgba(255,255,255,1)");
    horizontal.addColorStop(0.7, "rgba(255,255,255,0.45)");
    horizontal.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = horizontal;
    context.fillRect(0, 0, 64, 256);
    context.globalCompositeOperation = "destination-in";
    const vertical = context.createLinearGradient(0, 0, 0, 256);
    vertical.addColorStop(0, "rgba(255,255,255,0)");
    vertical.addColorStop(0.35, "rgba(255,255,255,0.85)");
    vertical.addColorStop(1, "rgba(255,255,255,1)");
    context.fillStyle = vertical;
    context.fillRect(0, 0, 64, 256);
    context.globalCompositeOperation = "source-over";
  } else if (shape === "sigil") {
    drawSigil(context);
  } else if (shape === "prism") {
    // Chromatic ring: rainbow bands across the ring thickness. Keep `color` white.
    const gradient = context.createRadialGradient(64, 64, 34, 64, 64, 62);
    const bands = ["rgba(255,80,220,0)", "rgba(255,80,220,0.9)", "rgba(90,120,255,0.95)", "rgba(80,230,255,1)",
      "rgba(255,255,255,1)", "rgba(120,255,120,0.95)", "rgba(255,240,90,0.9)", "rgba(255,120,60,0.8)", "rgba(255,120,60,0)"];
    bands.forEach((color, index) => gradient.addColorStop(index / (bands.length - 1), color));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  } else if (shape === "spark") {
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.22, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.strokeStyle = gradient;
    context.lineWidth = 4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(3, canvas.height / 2);
    context.lineTo(canvas.width - 3, canvas.height / 2);
    context.stroke();
  } else if (shape === "square") {
    context.fillRect(8, 8, 32, 32);
  } else if (shape === "star") {
    drawStar(context, 24, 24, 5, 20, 8);
  } else if (shape === "circle") {
    context.beginPath();
    context.arc(24, 24, 18, 0, Math.PI * 2);
    context.fill();
  } else {
    const gradient = context.createRadialGradient(24, 24, 2, 24, 24, 22);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.72)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return Texture.from(canvas);
}

function drawSigil(context: CanvasRenderingContext2D) {
  const cx = 64;
  const cy = 64;
  context.strokeStyle = "rgba(255,255,255,0.95)";
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.lineWidth = 2.5;
  for (const radius of [60, 52]) {
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();
  }
  // Rune ticks between the two outer circles
  context.lineWidth = 1.5;
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const inner = i % 3 === 0 ? 52 : 55;
    context.beginPath();
    context.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    context.lineTo(cx + Math.cos(angle) * 60, cy + Math.sin(angle) * 60);
    context.stroke();
  }
  // Two interlaced squares (eight-point star) and inner circle
  context.lineWidth = 2;
  for (const offset of [0, Math.PI / 4]) {
    context.beginPath();
    for (let i = 0; i <= 4; i++) {
      const angle = offset + (i / 4) * Math.PI * 2;
      const x = cx + Math.cos(angle) * 50;
      const y = cy + Math.sin(angle) * 50;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
  context.beginPath();
  context.arc(cx, cy, 24, 0, Math.PI * 2);
  context.stroke();
  // Nodes on the star points
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    context.beginPath();
    context.arc(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50, 3.5, 0, Math.PI * 2);
    context.fill();
  }
  const core = context.createRadialGradient(cx, cy, 0, cx, cy, 22);
  core.addColorStop(0, "rgba(255,255,255,0.7)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = core;
  context.fillRect(cx - 22, cy - 22, 44, 44);
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  points: number,
  outerRadius: number,
  innerRadius: number
) {
  context.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
}

export async function preloadParticleTextures(config: FxParticleConfig = {}) {
  const loads: Promise<any>[] = [];
  if (config.image && !imageTextures.has(config.image)) {
    const promise = Assets.load(config.image) as Promise<Texture>;
    imageTextures.set(config.image, promise);
    loads.push(
      promise.then((texture) => {
        imageTextures.set(config.image!, texture);
      })
    );
  }
  if (config.spritesheet) {
    loads.push(Promise.resolve(Assets.load(config.spritesheet)));
  }
  await Promise.all(loads);
}

export async function preloadPresetTextures(preset) {
  await Promise.all(
    (preset?.emitters ?? []).map((emitter) => preloadParticleTextures(emitter.particle))
  );
}

export function getParticleTextures(config: FxParticleConfig = {}, random = Math.random): Texture[] {
  if (config.texture) return [config.texture];
  if (config.frames?.length) {
    const frames = config.frames.map((frame) => Texture.from(frame));
    if (config.frameMode === "random") {
      return [frames[Math.floor(random() * frames.length)] ?? frames[0]];
    }
    return frames;
  }
  if (config.frame) return [Texture.from(config.frame)];
  if (config.image) {
    const cached = imageTextures.get(config.image);
    if (cached && !(cached instanceof Promise)) return [cached];
    return [];
  }
  return [getShapeTexture(config.shape)];
}
