import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import path from "node:path";
import {
  formatSummary,
  getEnvironment,
  writeReport,
  type BenchmarkReport,
} from "../shared/report";

const durationMs = Number(process.env.BENCH_RENDER_DURATION_MS ?? 5000);
const warmupMs = Number(process.env.BENCH_RENDER_WARMUP_MS ?? 1500);
const seed = Number(process.env.BENCH_RENDER_SEED ?? 42);
const counts = (process.env.BENCH_RENDER_COUNTS ?? "1000,5000")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
const runners = (process.env.BENCH_RENDER_RUNNERS ?? "canvasengine,pixijs")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value === "canvasengine" || value === "pixijs");

async function startServer(): Promise<ViteDevServer> {
  const server = await createServer({
    configFile: path.resolve("benchmarks", "render", "vite.config.ts"),
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
    },
  });
  await server.listen();
  return server;
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({
      headless: process.env.BENCH_HEADED !== "1",
    });
  } catch (error) {
    console.error("Unable to launch Chromium for render benchmarks.");
    console.error("Run `pnpm exec playwright install chromium` and retry.");
    throw error;
  }
}

const server = await startServer();
let browser: Browser | null = null;

try {
  const baseUrl = server.resolvedUrls?.local[0];
  if (!baseUrl) {
    throw new Error("Vite did not expose a local URL");
  }

  browser = await launchBrowser();
  const browserVersion = browser.version();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const benchmarks = [];

  for (const count of counts) {
    for (const runner of runners) {
      const scenario = `${runner}:sprites:${count}`;
      const url = new URL(baseUrl);
      url.searchParams.set("runner", runner);
      url.searchParams.set("scenario", scenario);
      url.searchParams.set("count", String(count));
      url.searchParams.set("durationMs", String(durationMs));
      url.searchParams.set("warmupMs", String(warmupMs));
      url.searchParams.set("seed", String(seed));

      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.waitForFunction(
        () => window.__CANVASENGINE_BENCHMARK_RESULT__ || window.__CANVASENGINE_BENCHMARK_ERROR__,
        null,
        { timeout: durationMs + warmupMs + 20000 }
      );

      const error = await page.evaluate(() => window.__CANVASENGINE_BENCHMARK_ERROR__);
      if (error) {
        throw new Error(error);
      }

      const result = await page.evaluate(() => window.__CANVASENGINE_BENCHMARK_RESULT__);
      benchmarks.push({
        name: scenario,
        ...(result as Record<string, unknown>),
      });
    }
  }

  const report: BenchmarkReport = {
    suite: "render",
    generatedAt: new Date().toISOString(),
    environment: getEnvironment({
      runner: "playwright",
      browser: "chromium",
      browserVersion,
      headless: process.env.BENCH_HEADED !== "1",
      durationMs,
      warmupMs,
      seed,
      runners,
    }),
    benchmarks,
    comparisons: buildRenderComparisons(benchmarks),
  };

  const reportPath = await writeReport(report);
  console.log(formatSummary(report));
  console.log(`Report written to ${reportPath}`);
} finally {
  await browser?.close();
  await server.close();
}

function buildRenderComparisons(benchmarks: Array<Record<string, unknown>>) {
  const byName = new Map(benchmarks.map((benchmark) => [String(benchmark.name), benchmark]));
  const comparisons = [];

  for (const benchmark of benchmarks) {
    const name = String(benchmark.name);
    const match = /^canvasengine:sprites:(\d+)$/.exec(name);
    if (!match) continue;

    const count = match[1];
    const pixiBenchmark = byName.get(`pixijs:sprites:${count}`);
    if (!pixiBenchmark) continue;

    const canvasMetrics = benchmark.metrics as Record<string, number> | undefined;
    const pixiMetrics = pixiBenchmark.metrics as Record<string, number> | undefined;
    if (!canvasMetrics || !pixiMetrics) continue;

    comparisons.push({
      scenario: `sprites:${count}`,
      baseline: "pixijs",
      candidate: "canvasengine",
      averageFpsRatio: ratio(canvasMetrics.averageFps, pixiMetrics.averageFps),
      frameTimeP95Ratio: ratio(canvasMetrics.frameTimeP95Ms, pixiMetrics.frameTimeP95Ms),
      updateTimeP95Ratio: ratio(canvasMetrics.updateTimeP95Ms, pixiMetrics.updateTimeP95Ms),
    });
  }

  return comparisons;
}

function ratio(candidate: number | undefined, baseline: number | undefined): number | null {
  if (!Number.isFinite(candidate) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  return Math.round((candidate! / baseline!) * 10000) / 10000;
}

declare global {
  interface Window {
    __CANVASENGINE_BENCHMARK_RESULT__?: unknown;
    __CANVASENGINE_BENCHMARK_ERROR__?: string;
  }
}
