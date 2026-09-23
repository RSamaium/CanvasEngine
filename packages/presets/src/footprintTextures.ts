import { Texture } from "pixi.js";

export type FootprintShape = "boot" | "shoe" | "bare" | "paw" | "hoof";

export type FootprintTextures = {
  /** Crisp depression, fades first as the print ages. */
  sharp: Texture;
  /** Softened depression, what remains of an old print. */
  soft: Texture;
  /** Raised edge lit from the top-left. */
  rim: Texture;
};

/** Textures are drawn at 3x for clean edges; sprites are scaled back down. */
export const FOOTPRINT_TEXTURE_SCALE = 1 / 3;

const WIDTH = 60;
const HEIGHT = 108;
const cache = new Map<FootprintShape, FootprintTextures>();

const createCanvas = () => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  return context ? { canvas, context } : null;
};

/** Toe at the top, heel at the bottom, centered on x = 30. */
function traceShape(context: CanvasRenderingContext2D, shape: FootprintShape) {
  context.beginPath();
  if (shape === "boot") {
    // Sole and heel are separate: the arch does not touch the ground.
    context.moveTo(30, 6);
    context.bezierCurveTo(47, 6, 50, 26, 47, 44);
    context.bezierCurveTo(45, 58, 38, 64, 30, 64);
    context.bezierCurveTo(22, 64, 15, 58, 13, 44);
    context.bezierCurveTo(10, 26, 13, 6, 30, 6);
    context.closePath();
    context.moveTo(19, 76);
    context.bezierCurveTo(19, 71, 41, 71, 41, 76);
    context.lineTo(41, 94);
    context.bezierCurveTo(41, 104, 19, 104, 19, 94);
    context.closePath();
  } else if (shape === "shoe") {
    const pointy = 4;
    context.moveTo(30, 6 - pointy);
    context.bezierCurveTo(48, 6, 50, 30, 48, 48);
    context.bezierCurveTo(46, 58, 40, 62, 40, 70);
    context.bezierCurveTo(42, 86, 42, 100, 30, 102);
    context.bezierCurveTo(18, 100, 18, 86, 20, 70);
    context.bezierCurveTo(20, 62, 13, 58, 12, 48);
    context.bezierCurveTo(10, 30, 12, 6, 30, 6 - pointy);
    context.closePath();
  } else if (shape === "bare") {
    context.ellipse(30, 88, 11, 14, 0, 0, Math.PI * 2);
    context.moveTo(44, 50);
    context.ellipse(31, 50, 14, 20, 0.08, 0, Math.PI * 2);
    context.moveTo(24, 70);
    context.ellipse(27, 70, 8, 14, 0.1, 0, Math.PI * 2);
    const toes: [number, number, number][] = [[20, 22, 6], [29, 18, 4.6], [37, 19, 4.2], [44, 23, 3.8], [49, 30, 3.3]];
    for (const [x, y, r] of toes) {
      context.moveTo(x + r, y);
      context.arc(x, y, r, 0, Math.PI * 2);
    }
  } else if (shape === "paw") {
    context.ellipse(30, 76, 15, 13, 0, 0, Math.PI * 2);
    const toes: [number, number][] = [[14, 48], [24, 38], [36, 38], [46, 48]];
    for (const [x, y] of toes) {
      context.moveTo(x + 6, y);
      context.ellipse(x, y, 6, 7.5, 0, 0, Math.PI * 2);
    }
  } else {
    // Hoof: a horseshoe-shaped print
    context.ellipse(30, 56, 22, 26, 0, 0, Math.PI * 2);
  }
}

function drawDepression(context: CanvasRenderingContext2D, shape: FootprintShape) {
  traceShape(context, shape);
  // Deeper (more opaque) in the middle of the print
  const gradient = context.createRadialGradient(30, 54, 4, 30, 54, 52);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0.72)");
  context.fillStyle = gradient;
  context.fill();

  context.globalCompositeOperation = "destination-out";
  if (shape === "boot") {
    // Tread lugs
    context.fillStyle = "rgba(0,0,0,0.55)";
    for (let y = 14; y < 56; y += 7) context.fillRect(12, y, 36, 2.2);
    for (let y = 76; y < 100; y += 6) context.fillRect(18, y, 24, 2);
  } else if (shape === "hoof") {
    context.fillStyle = "rgba(0,0,0,1)";
    context.beginPath();
    context.ellipse(30, 60, 12, 17, 0, 0, Math.PI * 2);
    context.fill();
    context.fillRect(22, 70, 16, 20);
  }
  context.globalCompositeOperation = "source-over";
}

function softenInto(target: CanvasRenderingContext2D, source: HTMLCanvasElement, blur: number) {
  if (typeof (target as { filter?: unknown }).filter === "string") {
    target.filter = `blur(${blur}px)`;
    target.drawImage(source, 0, 0);
    target.filter = "none";
    return;
  }
  const steps = 8;
  target.globalAlpha = 1 / steps + 0.06;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    target.drawImage(source, Math.cos(angle) * blur, Math.sin(angle) * blur);
  }
  target.globalAlpha = 1;
}

function drawRim(context: CanvasRenderingContext2D, shape: FootprintShape) {
  context.lineWidth = 5;
  context.strokeStyle = "#ffffff";
  traceShape(context, shape);
  context.stroke();
  // Keep the side facing the light (top-left)
  const light = context.createLinearGradient(8, 8, 52, 100);
  light.addColorStop(0, "rgba(0,0,0,1)");
  light.addColorStop(0.55, "rgba(0,0,0,0.35)");
  light.addColorStop(1, "rgba(0,0,0,0)");
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = light;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  // Only the raised border outside the print
  context.globalCompositeOperation = "destination-out";
  traceShape(context, shape);
  context.fill();
  context.globalCompositeOperation = "source-over";
}

export function getFootprintTextures(shape: FootprintShape = "boot"): FootprintTextures {
  const cached = cache.get(shape);
  if (cached && !cached.sharp.destroyed) return cached;

  const sharp = createCanvas();
  const soft = createCanvas();
  const rim = createCanvas();
  if (!sharp || !soft || !rim) {
    return { sharp: Texture.WHITE, soft: Texture.WHITE, rim: Texture.WHITE };
  }

  drawDepression(sharp.context, shape);
  softenInto(soft.context, sharp.canvas, 4);
  drawRim(rim.context, shape);
  softenInto(rim.context, rim.canvas, 0.8);

  const textures = {
    sharp: Texture.from(sharp.canvas),
    soft: Texture.from(soft.canvas),
    rim: Texture.from(rim.canvas),
  };
  cache.set(shape, textures);
  return textures;
}
