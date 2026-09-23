export type SurfaceSample = {
  /** Surface name, e.g. `water`, `grass`, `sand`, `ground`. */
  surface: string;
  /** Water depth from `0` (shore) to `1` (deep), `0` on land. */
  depth: number;
  /** Map color under the point, `0xRRGGBB`. */
  color: number;
};

export type SurfaceClassifier = (r: number, g: number, b: number) => { surface: string; depth?: number };

export interface SurfaceSampler {
  /** Surface under a world position (with `scale` applied). */
  sample: (x: number, y: number) => SurfaceSample;
  width: number;
  height: number;
}

/**
 * Default color rules for top-down RPG maps: blue/teal = water (lighter = shallower),
 * dominant green = grass, bright beige = sand, anything else = ground.
 */
export const defaultSurfaceClassifier: SurfaceClassifier = (r, g, b) => {
  if (b > r + 40 && (g > r + 40 || b > g)) {
    const depth = Math.max(0, Math.min(1, 1 - (g - 90) / 130));
    return { surface: "water", depth };
  }
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  // Foam / wet shore: very light, slightly cyan
  if (luma > 185 && g >= r && b >= r - 12 && g - b < 40) return { surface: "water", depth: 0 };
  if (g > r + 35 && g > b + 35) return { surface: "grass" };
  if (r > 170 && r >= g && g >= b) return { surface: "sand" };
  return { surface: "ground" };
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Surface sampler: cannot load ${url}`));
    image.src = url;
  });

/**
 * Reads a map image once and answers "what is under this point?" — the terrain type,
 * the water depth and the ground color — so sprites can react to the map without zones.
 *
 * @example
 * ```ts
 * const terrain = await createSurfaceSampler('./beach.webp')
 * terrain.sample(hero.x, hero.y) // { surface: 'water', depth: 0.4, color: 0x06b9c6 }
 * ```
 */
export async function createSurfaceSampler(
  image: string | HTMLImageElement | HTMLCanvasElement,
  options: {
    classify?: SurfaceClassifier;
    /** World units per image pixel. Default: `1` */
    scale?: number;
    /** Averaging radius in image pixels, smooths noisy pixel art. Default: `2` */
    radius?: number;
  } = {}
): Promise<SurfaceSampler> {
  const source = typeof image === "string" ? await loadImage(image) : image;
  const width = source.width;
  const height = source.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D;
  context.drawImage(source as CanvasImageSource, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;
  return createSurfaceSamplerFromPixels(pixels, width, height, options);
}

/** Same as `createSurfaceSampler`, from raw RGBA pixels. */
export function createSurfaceSamplerFromPixels(
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: { classify?: SurfaceClassifier; scale?: number; radius?: number } = {}
): SurfaceSampler {
  const classify = options.classify ?? defaultSurfaceClassifier;
  const scale = options.scale ?? 1;
  const radius = Math.max(0, Math.round(options.radius ?? 2));

  const sample = (x: number, y: number): SurfaceSample => {
    const cx = Math.round(x / scale);
    const cy = Math.round(y / scale);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.min(width - 1, Math.max(0, cx + dx));
        const py = Math.min(height - 1, Math.max(0, cy + dy));
        const index = (py * width + px) * 4;
        r += pixels[index];
        g += pixels[index + 1];
        b += pixels[index + 2];
        count++;
      }
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    const result = classify(r, g, b);
    return { surface: result.surface, depth: result.depth ?? 0, color: (r << 16) | (g << 8) | b };
  };

  return { sample, width: width * scale, height: height * scale };
}
