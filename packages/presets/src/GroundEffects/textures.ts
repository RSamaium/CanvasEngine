import { Texture } from "pixi.js";

const cache = new Map<string, Texture>();

const createCanvas = (width: number, height: number) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  return context ? { canvas, context } : null;
};

const cached = (key: string, draw: () => HTMLCanvasElement | null): Texture => {
  const existing = cache.get(key);
  if (existing && !existing.destroyed) return existing;
  const canvas = draw();
  const texture = canvas ? Texture.from(canvas) : Texture.WHITE;
  cache.set(key, texture);
  return texture;
};

/**
 * Half of a thin elliptical ripple ring. The back half is drawn behind the character,
 * the front half in front, so the ring really surrounds the body.
 */
export function getRippleTexture(half: "back" | "front"): Texture {
  return cached(`ripple-${half}`, () => {
    const target = createCanvas(128, 32);
    if (!target) return null;
    const { canvas, context } = target;
    context.translate(64, half === "back" ? 32 : 0);
    context.scale(1, 0.5);
    context.lineWidth = 6;
    const gradient = context.createRadialGradient(0, 0, 50, 0, 0, 62);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.strokeStyle = gradient;
    context.beginPath();
    context.arc(0, 0, 56, 0, Math.PI * 2);
    context.stroke();
    return canvas;
  });
}

/** Grass blades drawn in front of a character standing in tall grass. Tinted at runtime. */
export function getGrassTuftTexture(): Texture {
  return cached("grass-tuft", () => {
    const target = createCanvas(128, 64);
    if (!target) return null;
    const { canvas, context } = target;
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 30; i++) {
      const x = 10 + random() * 108;
      const height = 30 + random() * 32;
      const lean = (random() - 0.5) * 20;
      const width = 1.8 + random() * 2;
      const shade = 0.85 + random() * 0.15;
      const gradient = context.createLinearGradient(0, 64, 0, 64 - height);
      gradient.addColorStop(0, `rgba(${Math.round(205 * shade)},${Math.round(205 * shade)},${Math.round(205 * shade)},1)`);
      gradient.addColorStop(1, `rgba(${Math.round(255 * shade)},${Math.round(255 * shade)},${Math.round(255 * shade)},1)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(x - width, 64);
      context.quadraticCurveTo(x + lean * 0.3, 64 - height * 0.6, x + lean, 64 - height);
      context.quadraticCurveTo(x + lean * 0.3 + width * 0.5, 64 - height * 0.55, x + width, 64);
      context.closePath();
      context.fill();
    }
    // Fade the sides and the base so the tuft melts into the grass of the map
    context.globalCompositeOperation = "destination-in";
    const sides = context.createLinearGradient(0, 0, 128, 0);
    sides.addColorStop(0, "rgba(0,0,0,0)");
    sides.addColorStop(0.22, "rgba(0,0,0,1)");
    sides.addColorStop(0.78, "rgba(0,0,0,1)");
    sides.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = sides;
    context.fillRect(0, 0, 128, 64);
    const base = context.createLinearGradient(0, 0, 0, 64);
    base.addColorStop(0, "rgba(0,0,0,1)");
    base.addColorStop(0.7, "rgba(0,0,0,1)");
    base.addColorStop(1, "rgba(0,0,0,0.25)");
    context.fillStyle = base;
    context.fillRect(0, 0, 128, 64);
    return canvas;
  });
}

/** Soft round puff for dust, snow powder and water splashes. */
export function getPuffTexture(): Texture {
  return cached("puff", () => {
    const target = createCanvas(32, 32);
    if (!target) return null;
    const { canvas, context } = target;
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    return canvas;
  });
}
