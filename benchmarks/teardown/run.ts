/**
 * Scene teardown benchmark: real Pixi, layout and compiled templates in
 * Chromium. Compares the working tree (sync and deferred teardown) with the
 * engine at a git ref, alternating variants between rounds.
 *
 *   pnpm bench:teardown
 *   BENCH_TEARDOWN_BASELINE=v2 BENCH_TEARDOWN_COUNTS=100,300 pnpm bench:teardown
 *   BENCH_TEARDOWN_CPU=1 pnpm bench:teardown   # + CPU profile of the teardowns
 *
 * With BENCH_TEARDOWN_CPU=1, each variant also runs once under the Chrome
 * profiler, started and stopped around each teardown only (mounting is not
 * profiled). Self time by package and function is printed and the first
 * `.cpuprofile` of each variant is written next to the report.
 */
import { chromium, type Browser } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CpuProfileSummary, printCpuSummary, type CpuProfile } from "../shared/cpuprofile";
import { build, preview, type PreviewServer } from "vite";
import { execFileSync } from "node:child_process";
import { createTeardownConfig } from "./vite.config";
import { formatSummary, getEnvironment, percentile, roundMetric, writeReport, type BenchmarkReport } from "../shared/report";

const baselineRef = process.env.BENCH_TEARDOWN_BASELINE ?? "HEAD";
const counts = (process.env.BENCH_TEARDOWN_COUNTS ?? "100,300").split(",").map(Number).filter((value) => value > 0);
const rounds = Number(process.env.BENCH_TEARDOWN_ROUNDS ?? 3);
const cycles = Number(process.env.BENCH_TEARDOWN_CYCLES ?? 12);
const budgetMs = Number(process.env.BENCH_TEARDOWN_BUDGET_MS ?? 4);
// "absolute" positions characters with x / y, "flex" lays them out with @pixi/layout
const layouts = (process.env.BENCH_TEARDOWN_LAYOUTS ?? "absolute,flex").split(",").map((value) => value.trim());
// Scene resets its state (items, HUD rows) in an unmount hook, like game code does
const reset = process.env.BENCH_TEARDOWN_RESET === "1";
const withCpuProfile = process.env.BENCH_TEARDOWN_CPU === "1";
const cpuCount = Number(process.env.BENCH_TEARDOWN_CPU_COUNT ?? Math.max(...counts));
// "teardown" (default) or "mount": the phase recorded by the CPU profiler
const cpuPhase = process.env.BENCH_TEARDOWN_CPU_PHASE === "mount" ? "mount" : "teardown";

type Sample = {
  mountMs: number;
  syncMs: number;
  longestFrameMs: number;
  drainedMs: number;
  longAnimationFrameMs: number;
  blockingMs: number;
  longestChunkMs: number;
  chunks: number;
};

type Variant = { name: string; server: "baseline" | "candidate"; mode: "sync" | "deferred" };

const allVariants: Variant[] = [
  { name: `baseline (${baselineRef})`, server: "baseline", mode: "sync" },
  { name: "candidate sync", server: "candidate", mode: "sync" },
  { name: "candidate deferred", server: "candidate", mode: "deferred" },
];
// e.g. BENCH_TEARDOWN_VARIANTS="baseline,candidate sync" to skip the deferred run
const variantFilter = process.env.BENCH_TEARDOWN_VARIANTS?.split(",").map((name) => name.trim());
const variants = variantFilter
  ? allVariants.filter((variant) => variantFilter.some((name) => variant.name.startsWith(name)))
  : allVariants;

/**
 * Builds the page with the engine at `ref` and serves the build. Both sides
 * go through the same path (git ref, production build): serving one from a
 * dev server and the other from git showed a ~7% bias on identical code.
 */
async function start(name: string, ref: string): Promise<PreviewServer> {
  const config = createTeardownConfig(ref);
  const outDir = path.resolve("benchmarks", "results", ".build", `teardown-${name}`);
  await build({
    ...config,
    build: { outDir, emptyOutDir: true, minify: false, target: "es2022" },
  });
  return preview({ ...config, build: { outDir }, preview: { host: "127.0.0.1", port: 0 } });
}

/** A commit of the working tree (tracked files), without touching it. */
function workingTreeRef(): string {
  const stash = execFileSync("git", ["stash", "create"], { encoding: "utf8" }).trim();
  return stash || "HEAD";
}

function variantUrl(variant: Variant, count: number, layout = layouts[0]) {
  const url = new URL(servers[variant.server].resolvedUrls!.local[0]);
  url.searchParams.set("count", String(count));
  url.searchParams.set("layout", layout === "flex" ? "1" : "0");
  url.searchParams.set("reset", reset ? "1" : "0");
  url.searchParams.set("mode", variant.mode);
  url.searchParams.set("cycles", String(cycles));
  url.searchParams.set("budgetMs", String(budgetMs));
  return url.toString();
}

/** Runs one variant under the Chrome profiler, around each teardown only. */
async function profileVariant(browser: Browser, variant: Variant, outputDir: string) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
  const summary = new CpuProfileSummary();
  let first: CpuProfile | null = null;

  await page.exposeFunction("__teardownProfiler", async (action: "start" | "stop") => {
    if (action === "start") {
      await cdp.send("Profiler.start");
    } else {
      const { profile } = (await cdp.send("Profiler.stop")) as unknown as { profile: CpuProfile };
      summary.add(profile);
      first ??= profile;
    }
  });

  const url = new URL(variantUrl(variant, cpuCount));
  url.searchParams.set("profilePhase", cpuPhase);
  await page.goto(url.toString(), { waitUntil: "load" });
  await page.waitForFunction(() => window.__TEARDOWN_RESULT__ || window.__TEARDOWN_ERROR__, null, { timeout: 180000 });
  const error = await page.evaluate(() => window.__TEARDOWN_ERROR__);
  if (error) throw new Error(`${variant.name}: ${error}`);
  await page.close();

  const file = path.join(outputDir, `${variant.name.replace(/[^a-z0-9]+/gi, "_")}.cpuprofile`);
  if (first) await writeFile(file, JSON.stringify(first), "utf8");
  return { summary: summary.summary(Number(process.env.BENCH_TEARDOWN_CPU_TOP ?? 20)), file: path.relative(process.cwd(), file) };
}

const servers = {
  baseline: await start("baseline", baselineRef),
  candidate: await start("candidate", workingTreeRef()),
};
const headless = process.env.BENCH_HEADED !== "1";
// Playwright's Chromium when installed, else the system Google Chrome
const browser = await chromium
  .launch({ headless, channel: process.env.BENCH_BROWSER_CHANNEL })
  .catch(() => chromium.launch({ headless, channel: "chrome" }));

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const samples = new Map<string, Sample[]>();

  for (const layout of layouts) for (const count of counts) {
    for (let round = 0; round < rounds; round++) {
      // Rotate the order so no variant always runs first
      const ordered = variants.map((_, index) => variants[(index + round) % variants.length]);
      for (const variant of ordered) {
        await page.goto(variantUrl(variant, count, layout), { waitUntil: "load" });
        await page.waitForFunction(() => window.__TEARDOWN_RESULT__ || window.__TEARDOWN_ERROR__, null, {
          timeout: 120000,
        });
        const error = await page.evaluate(() => window.__TEARDOWN_ERROR__);
        if (error) throw new Error(`${variant.name}: ${error}`);
        const result = (await page.evaluate(() => window.__TEARDOWN_RESULT__)) as { samples: Sample[] };

        const key = `${variant.name} | ${count} items, ${layout}${reset ? ", state reset on unmount" : ""}`;
        samples.set(key, [...(samples.get(key) ?? []), ...result.samples]);
        process.stdout.write(".");
      }
    }
  }
  process.stdout.write("\n");

  const summarise = (values: number[]) => ({
    median: roundMetric(percentile(values, 50), 2),
    p95: roundMetric(percentile(values, 95), 2),
  });

  const benchmarks = [...samples.entries()].map(([name, list]) => {
    const mount = summarise(list.map((sample) => sample.mountMs));
    const sync = summarise(list.map((sample) => sample.syncMs));
    const frame = summarise(list.map((sample) => sample.longestFrameMs));
    const loaf = summarise(list.map((sample) => sample.longAnimationFrameMs));
    const drained = summarise(list.map((sample) => sample.drainedMs));
    const chunk = summarise(list.map((sample) => sample.longestChunkMs));
    return {
      name,
      metrics: {
        sampleCount: list.length,
        mountMedianMs: mount.median,
        mountP95Ms: mount.p95,
        syncMedianMs: sync.median,
        syncP95Ms: sync.p95,
        longestFrameMedianMs: frame.median,
        longestFrameP95Ms: frame.p95,
        longAnimationFrameMedianMs: loaf.median,
        drainedMedianMs: drained.median,
        longestChunkMedianMs: chunk.median,
        longestChunkP95Ms: chunk.p95,
        chunksMedian: summarise(list.map((sample) => sample.chunks)).median,
      },
    };
  });

  console.log("\nvariant | scene | mount ms (median) | sync ms (median / p95) | longest frame ms (median / p95) | long animation frame ms (median) | fully destroyed after ms (median) | deferred chunks: count, longest ms (median / p95)");
  for (const { name, metrics: m } of benchmarks) {
    const [variant, items] = name.split(" | ");
    console.log(
      `${variant} | ${items} | ${m.mountMedianMs} | ${m.syncMedianMs} / ${m.syncP95Ms} | ${m.longestFrameMedianMs} / ${m.longestFrameP95Ms}` +
      ` | ${m.longAnimationFrameMedianMs} | ${m.drainedMedianMs}` +
      (m.chunksMedian ? ` | ${m.chunksMedian}, ${m.longestChunkMedianMs} / ${m.longestChunkP95Ms}` : " | -")
    );
  }

  const profiles: Record<string, unknown> = {};
  if (withCpuProfile) {
    const outputDir = path.resolve("benchmarks", "results", "teardown", `cpu-${Date.now()}`);
    await mkdir(outputDir, { recursive: true });
    for (const variant of variants) {
      const { summary, file } = await profileVariant(browser, variant, outputDir);
      profiles[variant.name] = { ...summary, cpuProfilePath: file };
      console.log(`\nCPU profile, ${variant.name}, ${cpuCount} items (${cpuPhase} only, ${summary.totalMs} ms profiled)`);
      printCpuSummary(summary);
      console.log(`  profile: ${file}`);
    }
  }

  const report: BenchmarkReport = {
    suite: "teardown",
    generatedAt: new Date().toISOString(),
    environment: getEnvironment({
      runner: "playwright",
      browser: "chromium",
      browserVersion: browser.version(),
      baselineRef,
      rounds,
      cycles,
      budgetMs,
      layouts,
      reset,
    }),
    benchmarks,
    ...(withCpuProfile ? { profiles } : {}),
  };
  const reportPath = await writeReport(report);
  console.log(formatSummary(report));
  console.log(`Report written to ${reportPath}`);
} finally {
  await browser.close();
  await servers.baseline.close();
  await servers.candidate.close();
}

declare global {
  interface Window {
    __TEARDOWN_RESULT__?: unknown;
    __TEARDOWN_ERROR__?: string;
  }
}
