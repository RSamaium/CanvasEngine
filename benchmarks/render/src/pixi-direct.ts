import { Application, Assets, Container, Sprite } from "pixi.js";

type BenchmarkResult = {
  scenario: string;
  runner: "pixijs";
  config: Record<string, unknown>;
  metrics: Record<string, number>;
  validity: Record<string, unknown>;
};

declare global {
  interface Window {
    __CANVASENGINE_BENCHMARK_RESULT__?: BenchmarkResult;
    __CANVASENGINE_BENCHMARK_ERROR__?: string;
  }
}

export async function runPixiDirectBenchmark(rootElement: HTMLElement | null) {
  if (!rootElement) {
    throw new Error("Root element is required");
  }

  const params = new URLSearchParams(window.location.search);
  const elementCount = Number(params.get("count") ?? 1000);
  const durationMs = Number(params.get("durationMs") ?? 5000);
  const warmupMs = Number(params.get("warmupMs") ?? 1500);
  const seed = Number(params.get("seed") ?? 42);
  const scenario = params.get("scenario") ?? `pixijs:sprites:${elementCount}`;
  const frameBudgetMs = 1000 / 60;

  const app = new Application();
  await app.init({
    width: 1280,
    height: 720,
    resolution: 1,
    antialias: false,
    preference: "webgl",
    backgroundColor: "#101820",
  });

  rootElement.innerHTML = "";
  rootElement.appendChild(app.canvas);

  const texture = await Assets.load("/bench-sprite.svg");
  const container = new Container();
  app.stage.addChild(container);

  const random = mulberry32(seed);
  const items = generateItems(elementCount, random);
  const sprites = items.map((item) => {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = item.x;
    sprite.y = item.y;
    container.addChild(sprite);
    return sprite;
  });

  const frameTimes: number[] = [];
  const updateTimes: number[] = [];
  const longTasks: number[] = [];
  let startedAt = 0;
  let measureStartedAt = 0;
  let lastFrameAt = 0;
  let done = false;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push(entry.duration);
      }
    });
    observer.observe({ entryTypes: ["longtask"] });
  } catch {
    // Long task instrumentation is unavailable in some browser modes.
  }

  app.ticker.add((ticker) => {
    if (done) return;

    const now = performance.now();
    if (!startedAt) {
      startedAt = now;
      lastFrameAt = now;
      return;
    }

    const elapsed = now - startedAt;
    const measuring = elapsed >= warmupMs;

    if (measuring && !measureStartedAt) {
      measureStartedAt = now;
      lastFrameAt = now;
    }

    const updateStart = performance.now();
    for (let index = 0; index < sprites.length; index++) {
      const item = items[index];
      const sprite = sprites[index];
      sprite.rotation = item.baseRotation + ticker.lastTime * item.rotationSpeed;
      const scale = item.scaleBase + Math.sin(ticker.lastTime * item.scaleSpeed) * 0.2;
      sprite.scale.set(scale);
    }
    const updateDuration = performance.now() - updateStart;

    if (measuring) {
      frameTimes.push(now - lastFrameAt);
      updateTimes.push(updateDuration);
    }
    lastFrameAt = now;

    if (measureStartedAt && now - measureStartedAt >= durationMs) {
      done = true;
      app.stop();
      window.__CANVASENGINE_BENCHMARK_RESULT__ = buildResult({
        scenario,
        elementCount,
        durationMs,
        warmupMs,
        seed,
        frameBudgetMs,
        frameTimes,
        updateTimes,
        longTasks,
        assetReady: Boolean(texture.width > 0 && texture.height > 0 && sprites.length === elementCount),
        measuredDuration: now - measureStartedAt,
      });
    }
  });
}

function mulberry32(seedValue: number) {
  return function next() {
    let value = seedValue += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function generateItems(count: number, random: () => number) {
  const columns = Math.ceil(Math.sqrt(count));
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: (column * 26) % 1260 + 10,
      y: (row * 26) % 700 + 10,
      baseRotation: random() * Math.PI * 2,
      rotationSpeed: 0.004 + random() * 0.012,
      scaleBase: 0.75 + random() * 0.5,
      scaleSpeed: 0.003 + random() * 0.008,
    };
  });
}

function buildResult(input: {
  scenario: string;
  elementCount: number;
  durationMs: number;
  warmupMs: number;
  seed: number;
  frameBudgetMs: number;
  frameTimes: number[];
  updateTimes: number[];
  longTasks: number[];
  assetReady: boolean;
  measuredDuration: number;
}): BenchmarkResult {
  const droppedFrames = input.frameTimes.filter((value) => value > input.frameBudgetMs).length;

  return {
    scenario: input.scenario,
    runner: "pixijs",
    config: {
      elementCount: input.elementCount,
      durationMs: input.durationMs,
      warmupMs: input.warmupMs,
      seed: input.seed,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
    metrics: {
      averageFps: round(input.frameTimes.length / (input.measuredDuration / 1000), 4),
      frameTimeMeanMs: round(average(input.frameTimes), 4),
      frameTimeP50Ms: round(percentile(input.frameTimes, 50), 4),
      frameTimeP95Ms: round(percentile(input.frameTimes, 95), 4),
      frameTimeP99Ms: round(percentile(input.frameTimes, 99), 4),
      droppedFrames,
      longTasks: input.longTasks.length,
      longTaskMaxMs: round(Math.max(0, ...input.longTasks), 4),
      updateTimeMeanMs: round(average(input.updateTimes), 4),
      updateTimeP95Ms: round(percentile(input.updateTimes, 95), 4),
    },
    validity: getValidity(input),
  };
}

function getValidity(input: {
  assetReady: boolean;
  frameTimes: number[];
  measuredDuration: number;
  durationMs: number;
  seed: number;
}) {
  const reasons: string[] = [];
  if (!input.assetReady) reasons.push("assets-not-ready");
  if (input.frameTimes.length < 30) reasons.push("sample-count-low");
  if (input.measuredDuration < input.durationMs * 0.9) reasons.push("duration-too-short");

  return {
    valid: reasons.length === 0,
    reasons,
    sampleCount: input.frameTimes.length,
    warmupStable: true,
    assetReady: input.assetReady,
    deterministicSeed: input.seed,
  };
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
