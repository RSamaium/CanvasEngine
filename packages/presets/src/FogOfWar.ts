import { h, signal, Sprite, tick, useProps } from "canvasengine";
import { Texture } from "pixi.js";

type FogColor = [number, number, number, number];
type FogVisibilityState = "visible" | "explored" | "unknown";

type VisionSource = {
  x: number | (() => number);
  y: number | (() => number);
  radius: number | (() => number);
  enabled?: boolean | (() => boolean);
};

type ResolvedVisionSource = {
  x: number;
  y: number;
  radius: number;
  enabled: boolean;
};

type FogOfWarColors = {
  unknown?: FogColor;
  explored?: FogColor;
};

type FogOfWarProps = {
  mapWidth: number | (() => number);
  mapHeight: number | (() => number);
  tileSize?: number | (() => number);
  smooth?: boolean | (() => boolean);
  renderScale?: number | (() => number);
  edgeSoftness?: number | (() => number);
  visionSources?: VisionSource[] | (() => VisionSource[]);
  colors?: FogOfWarColors | (() => FogOfWarColors);
  updateHz?: number | (() => number);
  initialExplored?: boolean | (() => boolean);
  controller?: FogOfWarController | (() => FogOfWarController);
  obstacleMap?: unknown;
  [key: string]: unknown;
};

type FogSample = {
  clarity: number;
  explored: boolean;
};

type FogSampler = (x: number, y: number) => FogSample;

type FogControllerInternals = {
  setSampler: (sampler: FogSampler) => void;
  notifyUpdate: () => void;
};

export type FogOfWarController = {
  version: () => number;
  clarityAt: (x: number, y: number) => number;
  isVisibleAt: (x: number, y: number, threshold?: number) => boolean;
  isExploredAt: (x: number, y: number) => boolean;
  stateAt: (x: number, y: number, clearThreshold?: number) => FogVisibilityState;
};

const DEFAULT_UNKNOWN: FogColor = [0, 0, 0, 1];
const DEFAULT_EXPLORED: FogColor = [0, 0, 0, 0.55];
const DEFAULT_SAMPLE: FogSample = { clarity: 0, explored: false };
const defaultSampler: FogSampler = () => DEFAULT_SAMPLE;
const fogControllerRegistry = new WeakMap<FogOfWarController, FogControllerInternals>();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const smoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const resolveValue = (value: any): any => {
  if (typeof value === "function") return value();
  return value;
};

export function createFogOfWarController(): FogOfWarController {
  const revision = signal(0);
  let sampler: FogSampler = defaultSampler;

  const readSample = (x: number, y: number): FogSample => {
    revision();
    if (!Number.isFinite(x) || !Number.isFinite(y)) return DEFAULT_SAMPLE;
    return sampler(x, y);
  };

  const controller: FogOfWarController = {
    version: () => revision(),
    clarityAt: (x, y) => clamp(readSample(x, y).clarity, 0, 1),
    isVisibleAt: (x, y, threshold = 0.65) =>
      readSample(x, y).clarity >= clamp(threshold, 0, 1),
    isExploredAt: (x, y) => {
      const sample = readSample(x, y);
      return sample.explored || sample.clarity > 0;
    },
    stateAt: (x, y, clearThreshold = 0.65) => {
      const sample = readSample(x, y);
      if (sample.clarity >= clamp(clearThreshold, 0, 1)) return "visible";
      if (sample.explored || sample.clarity > 0) return "explored";
      return "unknown";
    },
  };

  fogControllerRegistry.set(controller, {
    setSampler(nextSampler) {
      sampler = typeof nextSampler === "function" ? nextSampler : defaultSampler;
    },
    notifyUpdate() {
      revision.update((value: number) => value + 1);
    },
  });

  return controller;
}

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
    smooth = signal(true),
    renderScale = signal(2),
    edgeSoftness = signal(22),
    visionSources = signal([]),
    colors = signal({}),
    updateHz = signal(15),
    initialExplored = signal(false),
    controller = undefined,
    obstacleMap = undefined,
    ...spriteProps
  } = useProps(options);

  // Placeholder for phase 2 LOS support with blocking tiles.
  void obstacleMap;

  let fogCanvas: HTMLCanvasElement;
  let fogCtx: CanvasRenderingContext2D | null = null;
  let fogTexture: Texture = Texture.WHITE;
  let imageData: ImageData | null = null;
  let pixelData: Uint8ClampedArray | null = null;
  let visibilityNow = new Float32Array(0);
  let explored = new Uint8Array(0);
  let gridWidth = 1;
  let gridHeight = 1;
  let cellCount = 1;
  let cachedMapWidth = 1;
  let cachedMapHeight = 1;
  let cachedTileSize = 1;
  let cachedCellSize = 1;
  let cachedRenderScale = 1;
  let accumulatorMs = 0;
  let forceRefresh = true;
  let activeController: FogOfWarController | null = null;
  let activeControllerInternals: FogControllerInternals | null = null;
  let previousSourcesSnapshot: number[] = [];

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

  const resolveRenderScale = () => {
    const smoothEnabled = resolveValue(smooth) !== false;
    const fallback = smoothEnabled ? 2 : 1;
    const value = Number(resolveValue(renderScale));
    if (!Number.isFinite(value)) return fallback;
    return clamp(Math.round(value), 1, 8);
  };

  const resolveEdgeSoftness = () => {
    if (resolveValue(smooth) === false) return 0;
    const value = Number(resolveValue(edgeSoftness));
    if (!Number.isFinite(value)) return Math.max(cachedCellSize * 0.9, 2);
    return Math.max(0, value);
  };

  const resolveController = () => {
    const value = resolveValue(controller);
    return value && typeof value === "object"
      ? (value as FogOfWarController)
      : undefined;
  };

  const resolveVisionSources = (): ResolvedVisionSource[] => {
    const sources = resolveSources(visionSources);
    const resolved: ResolvedVisionSource[] = [];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      resolved.push({
        x: Number(resolveValue(source.x)),
        y: Number(resolveValue(source.y)),
        radius: Number(resolveValue(source.radius)),
        enabled: resolveValue(source.enabled) !== false,
      });
    }
    return resolved;
  };

  const didSourcesChange = (sources: ResolvedVisionSource[]) => {
    const snapshot = new Array(sources.length * 4);
    let index = 0;
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      snapshot[index++] = source.x;
      snapshot[index++] = source.y;
      snapshot[index++] = source.radius;
      snapshot[index++] = source.enabled ? 1 : 0;
    }

    let changed = snapshot.length !== previousSourcesSnapshot.length;
    if (!changed) {
      for (let i = 0; i < snapshot.length; i++) {
        const next = snapshot[i];
        const prev = previousSourcesSnapshot[i];
        if (Number.isNaN(next) !== Number.isNaN(prev) || Math.abs(next - prev) > 0.01) {
          changed = true;
          break;
        }
      }
    }

    previousSourcesSnapshot = snapshot;
    return changed;
  };

  const sampleFog = (worldX: number, worldY: number): FogSample => {
    if (
      !Number.isFinite(worldX) ||
      !Number.isFinite(worldY) ||
      cellCount <= 0 ||
      gridWidth <= 0 ||
      gridHeight <= 0
    ) {
      return DEFAULT_SAMPLE;
    }

    const safeX = clamp(worldX, 0, Math.max(0, cachedMapWidth - 1));
    const safeY = clamp(worldY, 0, Math.max(0, cachedMapHeight - 1));
    const cellX = Math.min(gridWidth - 1, Math.max(0, Math.floor(safeX / cachedCellSize)));
    const cellY = Math.min(gridHeight - 1, Math.max(0, Math.floor(safeY / cachedCellSize)));
    const index = cellY * gridWidth + cellX;

    return {
      clarity: clamp(visibilityNow[index] ?? 0, 0, 1),
      explored: explored[index] === 1,
    };
  };

  const syncController = (notify: boolean) => {
    const nextController = resolveController() ?? null;
    if (nextController !== activeController) {
      if (activeControllerInternals) {
        activeControllerInternals.setSampler(defaultSampler);
      }
      activeController = nextController;
      activeControllerInternals = activeController
        ? fogControllerRegistry.get(activeController) ?? null
        : null;
      if (activeControllerInternals) {
        activeControllerInternals.setSampler(sampleFog);
      }
      notify = true;
    }
    if (notify && activeControllerInternals) {
      activeControllerInternals.notifyUpdate();
    }
  };

  const applyTextureScaleMode = () => {
    const source = (fogTexture as any).source;
    if (!source) return;
    source.scaleMode = resolveValue(smooth) === false ? "nearest" : "linear";
  };

  const resizeFogBuffers = (
    nextMapWidth: number,
    nextMapHeight: number,
    nextTileSize: number,
    nextRenderScale: number
  ) => {
    cachedMapWidth = Math.max(1, Math.floor(nextMapWidth));
    cachedMapHeight = Math.max(1, Math.floor(nextMapHeight));
    cachedTileSize = Math.max(1, Math.floor(nextTileSize));
    cachedRenderScale = clamp(nextRenderScale, 1, 8);
    cachedCellSize = Math.max(1, cachedTileSize / cachedRenderScale);
    gridWidth = Math.max(1, Math.ceil(cachedMapWidth / cachedCellSize));
    gridHeight = Math.max(1, Math.ceil(cachedMapHeight / cachedCellSize));
    cellCount = gridWidth * gridHeight;

    if ("width" in fogCanvas) {
      (fogCanvas as any).width = gridWidth;
      (fogCanvas as any).height = gridHeight;
    }

    visibilityNow = new Float32Array(cellCount);
    explored = new Uint8Array(cellCount);
    if (resolveValue(initialExplored)) explored.fill(1);

    imageData = fogCtx?.createImageData(gridWidth, gridHeight) ?? null;
    pixelData = imageData?.data ?? null;
    applyTextureScaleMode();
    forceRefresh = true;
  };

  const drawVisionCircle = (source: ResolvedVisionSource, featherCells: number) => {
    if (
      source.enabled === false ||
      !Number.isFinite(source.x) ||
      !Number.isFinite(source.y) ||
      !Number.isFinite(source.radius) ||
      source.radius <= 0
    ) {
      return;
    }

    const x = source.x;
    const y = source.y;
    const radius = source.radius;
    const radiusInCells = radius / cachedCellSize;
    const innerRadius = Math.max(0, radiusInCells - featherCells);
    const outerRadius = Math.max(radiusInCells, radiusInCells + featherCells);
    const innerRadiusSq = innerRadius * innerRadius;
    const outerRadiusSq = outerRadius * outerRadius;

    const minX = Math.max(0, Math.floor(x / cachedCellSize - outerRadius));
    const maxX = Math.min(gridWidth - 1, Math.ceil(x / cachedCellSize + outerRadius));
    const minY = Math.max(0, Math.floor(y / cachedCellSize - outerRadius));
    const maxY = Math.min(gridHeight - 1, Math.ceil(y / cachedCellSize + outerRadius));

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const centerX = (tx + 0.5) * cachedCellSize;
        const centerY = (ty + 0.5) * cachedCellSize;
        const dx = centerX - x;
        const dy = centerY - y;
        const distanceSq = (dx * dx + dy * dy) / (cachedCellSize * cachedCellSize);
        if (distanceSq > outerRadiusSq) continue;

        let clarity = 1;
        if (outerRadius > innerRadius && distanceSq > innerRadiusSq) {
          const distance = Math.sqrt(distanceSq);
          const fade = smoothstep(innerRadius, outerRadius, distance);
          clarity = 1 - fade;
        }
        if (clarity <= 0.001) continue;

        const index = ty * gridWidth + tx;
        if (clarity > visibilityNow[index]) {
          visibilityNow[index] = clarity;
        }
        if (clarity > 0.02) explored[index] = 1;
      }
    }
  };

  const rasterizeFog = (resolvedSources?: ResolvedVisionSource[]) => {
    if (!imageData || !pixelData || !fogCtx) return;

    const rawColors = resolveValue(colors) || {};
    const unknown = toColorBytes(rawColors.unknown, DEFAULT_UNKNOWN);
    const known = toColorBytes(rawColors.explored, DEFAULT_EXPLORED);

    visibilityNow.fill(0);
    const sources = resolvedSources ?? resolveVisionSources();
    const featherCells = resolveEdgeSoftness() / cachedCellSize;
    for (let i = 0; i < sources.length; i++) {
      drawVisionCircle(sources[i], featherCells);
    }

    for (let i = 0; i < cellCount; i++) {
      const p = i * 4;
      const clarity = clamp(visibilityNow[i], 0, 1);
      const isExplored = explored[i] === 1;
      const fogColor = isExplored ? known : unknown;
      pixelData[p] = fogColor.r;
      pixelData[p + 1] = fogColor.g;
      pixelData[p + 2] = fogColor.b;
      pixelData[p + 3] = Math.round(fogColor.a * (1 - clarity));
    }

    fogCtx.putImageData(imageData, 0, 0);
    const source = (fogTexture as any).source;
    if (source && typeof source.update === "function") source.update();
    else if (typeof (fogTexture as any).update === "function") (fogTexture as any).update();
    syncController(true);
  };

  const initialMapWidth = Number(resolveValue(mapWidth)) || 1;
  const initialMapHeight = Number(resolveValue(mapHeight)) || 1;
  const initialTileSize = Number(resolveValue(tileSize)) || 32;
  const initialRenderScale = resolveRenderScale();
  resizeFogBuffers(initialMapWidth, initialMapHeight, initialTileSize, initialRenderScale);
  rasterizeFog();

  tick(({ deltaTime }) => {
    if (!fogCtx) return;

    const mw = Math.max(1, Number(resolveValue(mapWidth)) || 1);
    const mh = Math.max(1, Number(resolveValue(mapHeight)) || 1);
    const ts = Math.max(1, Number(resolveValue(tileSize)) || 32);
    const rs = resolveRenderScale();
    if (
      mw !== cachedMapWidth ||
      mh !== cachedMapHeight ||
      ts !== cachedTileSize ||
      rs !== cachedRenderScale
    ) {
      resizeFogBuffers(mw, mh, ts, rs);
    }
    applyTextureScaleMode();
    syncController(false);
    const resolvedSources = resolveVisionSources();
    const sourcesChanged = didSourcesChange(resolvedSources);
    if (sourcesChanged) {
      // Keep vision movement visually smooth even with low updateHz.
      forceRefresh = true;
    }

    const hz = Math.max(1, Number(resolveValue(updateHz)) || 15);
    const intervalMs = 1000 / hz;
    accumulatorMs += deltaTime;

    if (forceRefresh || sourcesChanged || accumulatorMs >= intervalMs) {
      accumulatorMs = 0;
      forceRefresh = false;
      rasterizeFog(resolvedSources);
    }
  });

  return h(Sprite, {
    ...spriteProps,
    texture: fogTexture,
    x: 0,
    y: 0,
    width: Math.max(1, Number(resolveValue(mapWidth)) || 1),
    height: Math.max(1, Number(resolveValue(mapHeight)) || 1),
    roundPixels: true,
  });
}
