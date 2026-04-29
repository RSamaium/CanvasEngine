import { Assets, Texture } from "pixi.js";
import type { FxParticleConfig, FxShape } from "./types";

const shapeTextures = new Map<FxShape, Texture>();
const imageTextures = new Map<string, Promise<Texture> | Texture>();

export function getShapeTexture(shape: FxShape = "softCircle"): Texture {
  if (!shapeTextures.has(shape)) {
    shapeTextures.set(shape, createShapeTexture(shape));
  }
  return shapeTextures.get(shape)!;
}

function createShapeTexture(shape: FxShape): Texture {
  if (typeof document === "undefined") return Texture.WHITE;

  const canvas = document.createElement("canvas");
  canvas.width = shape === "spark" ? 64 : 48;
  canvas.height = shape === "spark" ? 16 : 48;
  const context = canvas.getContext("2d");
  if (!context) return Texture.WHITE;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ffffff";

  if (shape === "spark") {
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
