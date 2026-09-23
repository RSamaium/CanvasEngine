import { Texture } from "pixi.js";

type PointLike = { x: number; y: number };
type RectLike = { x: number; y: number; width: number; height: number };

/**
 * A caster silhouette prepared as a shadow texture.
 * `footX` / `footY` locate the caster's feet in the texture (pixels), `heightPx` is the
 * silhouette height above the feet, and `localPerPx` converts texture pixels to caster local units.
 */
export type ShadowSilhouette = {
  texture: Texture;
  footX: number;
  footY: number;
  heightPx: number;
  localPerPx: number;
};

export type SilhouetteOptions = {
  /** Penumbra blur at the tip of the shadow, in texture pixels. */
  blur: number;
  /** 0 = very soft shadow, 1 = crisp shadow. */
  hardness: number;
  /** How fast the shadow fades toward its tip. */
  gradientPower: number;
  /** Feet position in caster local coordinates. */
  foot: PointLike;
};

const MAX_CACHE = 256;
const cache = new Map<string, ShadowSilhouette>();
let contactTexture: Texture | null = null;

const createCanvas = (width: number, height: number) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const context = canvas.getContext("2d");
  return context ? { canvas, context } : null;
};

const remember = (key: string, value: ShadowSilhouette) => {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.get(oldest)?.texture.destroy(true);
      cache.delete(oldest);
    }
  }
  cache.set(key, value);
  return value;
};

/** Soft elliptical blob, used for contact shadows and as a fallback silhouette. */
export function getContactShadowTexture(): Texture {
  if (contactTexture && !contactTexture.destroyed) return contactTexture;
  const target = createCanvas(128, 64);
  if (!target) return Texture.WHITE;
  const { canvas, context } = target;
  context.translate(64, 32);
  context.scale(1, 0.5);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 62);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.75)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, 62, 0, Math.PI * 2);
  context.fill();
  contactTexture = Texture.from(canvas);
  return contactTexture;
}

/**
 * Fallback silhouette (a soft blob) when the caster pixels cannot be read,
 * for example without a renderer.
 */
export function getBlobSilhouette(rect: RectLike): ShadowSilhouette {
  const texture = getContactShadowTexture();
  const width = texture.width || 128;
  const height = texture.height || 64;
  return {
    texture,
    footX: width / 2,
    footY: height * 0.85,
    heightPx: height * 0.7,
    localPerPx: Math.max(0.01, rect.width * 0.6) / width,
  };
}

const drawBlurred = (
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  blur: number
) => {
  if (blur <= 0.05) {
    context.drawImage(source, 0, 0);
    return;
  }
  if (typeof (context as { filter?: unknown }).filter === "string") {
    context.filter = `blur(${blur}px)`;
    context.drawImage(source, 0, 0);
    context.filter = "none";
    return;
  }
  // Fallback: accumulate offset copies (cheap box blur).
  const steps = 8;
  context.globalAlpha = 1 / steps + 0.08;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    context.drawImage(source, Math.cos(angle) * blur * 0.7, Math.sin(angle) * blur * 0.7);
  }
  context.globalAlpha = 1;
};

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const verticalMask = (
  context: CanvasRenderingContext2D,
  width: number,
  topY: number,
  footY: number,
  alphaAt: (t: number) => number
) => {
  // t = 0 at the feet, 1 at the top of the silhouette
  const gradient = context.createLinearGradient(0, footY, 0, topY);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    gradient.addColorStop(t, `rgba(0,0,0,${Math.max(0, Math.min(1, alphaAt(t)))})`);
  }
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, context.canvas.height);
  // Keep what lies below the feet fully opaque (the gradient stops at footY).
  context.globalCompositeOperation = "source-over";
};

/**
 * Turns caster pixels into a shadow texture: solid near the feet,
 * blurred and fading toward the tip (penumbra grows with distance).
 */
export function bakeSilhouette(
  key: string,
  source: HTMLCanvasElement,
  rect: RectLike,
  options: SilhouetteOptions
): ShadowSilhouette | null {
  const cacheKey = `${key}|${options.blur.toFixed(1)}|${options.hardness.toFixed(2)}|${options.gradientPower.toFixed(2)}|${options.foot.x.toFixed(1)}|${options.foot.y.toFixed(1)}`;
  const cached = cache.get(cacheKey);
  if (cached && !cached.texture.destroyed) return cached;

  const localPerPx = rect.width / Math.max(1, source.width);
  const blur = Math.max(0, options.blur) / Math.max(0.01, localPerPx);
  const pad = Math.ceil(blur * 2.5) + 2;
  const width = source.width + pad * 2;
  const height = source.height + pad * 2;
  const footX = pad + (options.foot.x - rect.x) / localPerPx;
  const footY = pad + (options.foot.y - rect.y) / localPerPx;
  const topY = pad;
  const heightPx = Math.max(1, footY - topY);

  const silhouette = createCanvas(width, height);
  const near = createCanvas(width, height);
  const far = createCanvas(width, height);
  const output = createCanvas(width, height);
  if (!silhouette || !near || !far || !output) return null;

  // Flat white silhouette of the caster (tinted with the shadow color at runtime)
  silhouette.context.drawImage(source, pad, pad);
  silhouette.context.globalCompositeOperation = "source-in";
  silhouette.context.fillStyle = "#ffffff";
  silhouette.context.fillRect(0, 0, width, height);

  const hardness = Math.max(0, Math.min(1, options.hardness));
  const power = Math.max(0.2, options.gradientPower);

  // Body of the shadow: a flat tone with softened edges (2D RPG look)
  drawBlurred(near.context, silhouette.canvas, blur * (0.25 + (1 - hardness) * 0.25));
  verticalMask(near.context, width, topY, footY, (t) => 1 - smoothstep(0.45, 1, t));

  // Tip: softer, it takes over toward the end of the shadow
  drawBlurred(far.context, silhouette.canvas, blur);
  verticalMask(far.context, width, topY, footY, (t) => smoothstep(0.3, 0.85, t));

  output.context.drawImage(near.canvas, 0, 0);
  output.context.drawImage(far.canvas, 0, 0);
  // Gentle fade: the tip keeps most of its tone instead of vanishing into a dark streak
  const tail = 0.3 + hardness * 0.4;
  verticalMask(output.context, width, topY, footY, (t) => 1 - (1 - tail) * Math.pow(t, power * 0.6));

  return remember(cacheKey, {
    texture: Texture.from(output.canvas),
    footX,
    footY,
    heightPx,
    localPerPx,
  });
}

export function clearSilhouetteCache() {
  for (const value of cache.values()) value.texture.destroy(true);
  cache.clear();
}
