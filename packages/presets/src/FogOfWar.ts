import { h, mount, signal, Sprite, tick, useProps } from "canvasengine";
import { Texture } from "pixi.js";

type FogColor = [number, number, number, number];

type VisionSource = {
  x: number | (() => number);
  y: number | (() => number);
  radius: number | (() => number);
  enabled?: boolean | (() => boolean);
};

type FogOfWarColors = {
  unknown?: FogColor;
  explored?: FogColor;
};

type FogOfWarProps = {
  mapWidth: number | (() => number);
  mapHeight: number | (() => number);
  tileSize?: number | (() => number);
  visionSources?: VisionSource[] | (() => VisionSource[]);
  colors?: FogOfWarColors | (() => FogOfWarColors);
  updateHz?: number | (() => number);
  initialExplored?: boolean | (() => boolean);
  obstacleMap?: unknown;
  [key: string]: unknown;
};

const DEFAULT_UNKNOWN: FogColor = [0, 0, 0, 1];
const DEFAULT_EXPLORED: FogColor = [0, 0, 0, 0.55];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const resolveValue = (value: any): any => {
  if (typeof value === "function") return value();
  return value;
};

const toColorBytes = (input: FogColor, fallback: FogColor) => {
  const value = Array.isArray(input) ? input : fallback;
  const [r, g, b, a] = value;
  const normalize = (n: number, alpha = false) => {
    if (!Number.isFinite(n)) return alpha ? 255 : 0;
    if (n >= 0 && n <= 1) return Math.round(n * 255);
    return clamp(Math.round(n), 0, 255);
  };
  return {
    r: normalize(r),
    g: normalize(g),
    b: normalize(b),
    a: normalize(a, true),
  };
};

const resolveSources = (input: VisionSource[] | (() => VisionSource[])) => {
  const raw = resolveValue(input);
  if (!Array.isArray(raw)) return [];
  return raw;
};

export function FogOfWar(options: FogOfWarProps) {
  const {
    mapWidth,
    mapHeight,
    tileSize = signal(32),
    visionSources = signal([]),
    colors = signal({}),
    updateHz = signal(15),
    initialExplored = signal(false),
    obstacleMap = undefined,
    ...spriteProps
  } = useProps(options);

  // Placeholder for phase 2 LOS support with blocking tiles.
  void obstacleMap;

  let fogCanvas: HTMLCanvasElement;
  let fogCtx: CanvasRenderingContext2D | null = null;
  let fogTexture: Texture = Texture.WHITE;
  const readySignal = signal(false);
  let imageData: ImageData | null = null;
  let pixelData: Uint8ClampedArray | null = null;
  let visibleNow = new Uint8Array(0);
  let explored = new Uint8Array(0);
  let gridWidth = 1;
  let gridHeight = 1;
  let cellCount = 1;
  let cachedMapWidth = 1;
  let cachedMapHeight = 1;
  let cachedTileSize = 1;
  let accumulatorMs = 0;
  let forceRefresh = true;
  const overlayWidth = signal(1);
  const overlayHeight = signal(1);

  const createFogCanvas = () => {
    if (typeof document === "undefined") {
      throw new Error("FogOfWar: document is undefined, canvas cannot be created.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  };

  fogCanvas = createFogCanvas();
  fogCtx = fogCanvas.getContext("2d", { willReadFrequently: true });
  if (!fogCtx) {
    throw new Error("FogOfWar: unable to create 2D context for fog canvas.");
  }
  fogTexture = Texture.from(fogCanvas);

  const resizeFogBuffers = (nextMapWidth: number, nextMapHeight: number, nextTileSize: number) => {
    cachedMapWidth = Math.max(1, Math.floor(nextMapWidth));
    cachedMapHeight = Math.max(1, Math.floor(nextMapHeight));
    cachedTileSize = Math.max(1, Math.floor(nextTileSize));
    overlayWidth.set(cachedMapWidth);
    overlayHeight.set(cachedMapHeight);
    gridWidth = Math.max(1, Math.ceil(cachedMapWidth / cachedTileSize));
    gridHeight = Math.max(1, Math.ceil(cachedMapHeight / cachedTileSize));
    cellCount = gridWidth * gridHeight;

    if ("width" in fogCanvas) {
      (fogCanvas as any).width = gridWidth;
      (fogCanvas as any).height = gridHeight;
    }

    visibleNow = new Uint8Array(cellCount);
    explored = new Uint8Array(cellCount);
    if (resolveValue(initialExplored)) explored.fill(1);

    imageData = fogCtx?.createImageData(gridWidth, gridHeight) ?? null;
    pixelData = imageData?.data ?? null;
    forceRefresh = true;
  };

  const drawVisionCircle = (source: VisionSource) => {
    const enabled = resolveValue(source.enabled);
    if (enabled === false) return;

    const x = Number(resolveValue(source.x));
    const y = Number(resolveValue(source.y));
    const radius = Number(resolveValue(source.radius));
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) {
      return;
    }

    const radiusInTiles = Math.ceil(radius / cachedTileSize);
    const centerTileX = x / cachedTileSize;
    const centerTileY = y / cachedTileSize;
    const radiusSq = (radius / cachedTileSize) * (radius / cachedTileSize);

    const minX = Math.max(0, Math.floor(centerTileX - radiusInTiles));
    const maxX = Math.min(gridWidth - 1, Math.ceil(centerTileX + radiusInTiles));
    const minY = Math.max(0, Math.floor(centerTileY - radiusInTiles));
    const maxY = Math.min(gridHeight - 1, Math.ceil(centerTileY + radiusInTiles));

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const dx = tx + 0.5 - centerTileX;
        const dy = ty + 0.5 - centerTileY;
        if (dx * dx + dy * dy > radiusSq) continue;
        const index = ty * gridWidth + tx;
        visibleNow[index] = 1;
        explored[index] = 1;
      }
    }
  };

  const rasterizeFog = () => {
    if (!imageData || !pixelData || !fogCtx || !readySignal()) return;

    const rawColors = resolveValue(colors) || {};
    const unknown = toColorBytes(rawColors.unknown, DEFAULT_UNKNOWN);
    const known = toColorBytes(rawColors.explored, DEFAULT_EXPLORED);

    visibleNow.fill(0);
    const sources = resolveSources(visionSources);
    for (let i = 0; i < sources.length; i++) {
      drawVisionCircle(sources[i]);
    }

    for (let i = 0; i < cellCount; i++) {
      const p = i * 4;
      if (visibleNow[i] === 1) {
        pixelData[p] = 0;
        pixelData[p + 1] = 0;
        pixelData[p + 2] = 0;
        pixelData[p + 3] = 0;
      } else if (explored[i] === 1) {
        pixelData[p] = known.r;
        pixelData[p + 1] = known.g;
        pixelData[p + 2] = known.b;
        pixelData[p + 3] = known.a;
      } else {
        pixelData[p] = unknown.r;
        pixelData[p + 1] = unknown.g;
        pixelData[p + 2] = unknown.b;
        pixelData[p + 3] = unknown.a;
      }
    }

    fogCtx.putImageData(imageData, 0, 0);
    const source = (fogTexture as any).source;
    if (source && typeof source.update === "function") source.update();
    else if (typeof (fogTexture as any).update === "function") (fogTexture as any).update();
  };

  mount(() => {
    const mw = Number(resolveValue(mapWidth)) || 1;
    const mh = Number(resolveValue(mapHeight)) || 1;
    const ts = Number(resolveValue(tileSize)) || 32;
    resizeFogBuffers(mw, mh, ts);

    const source = (fogTexture as any).source;
    if (source) {
      source.scaleMode = "nearest";
    }

    readySignal.set(true);
    rasterizeFog();
  });

  tick(({ deltaTime }) => {
    if (!fogCtx || !readySignal()) return;

    const mw = Math.max(1, Number(resolveValue(mapWidth)) || 1);
    const mh = Math.max(1, Number(resolveValue(mapHeight)) || 1);
    const ts = Math.max(1, Number(resolveValue(tileSize)) || 32);
    if (mw !== cachedMapWidth || mh !== cachedMapHeight || ts !== cachedTileSize) {
      resizeFogBuffers(mw, mh, ts);
    }

    const hz = Math.max(1, Number(resolveValue(updateHz)) || 15);
    const intervalMs = 1000 / hz;
    accumulatorMs += deltaTime;

    if (forceRefresh || accumulatorMs >= intervalMs) {
      accumulatorMs = 0;
      forceRefresh = false;
      rasterizeFog();
    }
  });

  return h(Sprite, {
    ...spriteProps,
    texture: fogTexture,
    x: 0,
    y: 0,
    width: overlayWidth,
    height: overlayHeight,
    roundPixels: true,
  });
}
