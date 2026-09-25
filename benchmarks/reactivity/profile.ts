/**
 * Profiles reactivity scenarios with a fixed iteration count.
 *
 * Unlike the tinybench suite, it reports medians (robust on a busy machine),
 * the heap retained per iteration, leaked or twice destroyed instances, and an
 * optional V8 CPU profile summarised by function and by package.
 *
 * Usage:
 *   pnpm bench:profile [filter] [--iterations 200] [--warmup 20] [--cpu] [--top 15]
 *   pnpm bench:profile [filter] --baseline HEAD
 *
 * `filter` is a comma separated list of substrings of scenario names.
 * With `--cpu`, `.cpuprofile` files are written next to the report and can be
 * opened in Chrome DevTools (Performance panel) or https://www.speedscope.app.
 * With `--baseline <git ref>`, the engine is also bundled as it is at that ref
 * and both versions run interleaved (A B B A ...) in the same process, so
 * machine noise affects them equally.
 */
import { Session } from "node:inspector/promises";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { bundleEntry, loadSourceMap } from "../shared/bundle";
import type { Scenario } from "./scenarios";
import {
  getEnvironment,
  percentile,
  roundMetric,
  writeReport,
  type BenchmarkReport,
} from "../shared/report";

type CpuProfileNode = {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number; columnNumber: number };
  hitCount?: number;
  children?: number[];
};

type CpuProfile = {
  nodes: CpuProfileNode[];
  startTime: number;
  endTime: number;
  samples?: number[];
};

const args = process.argv.slice(2);
const readOption = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const readFlag = (name: string, fallback: number) => {
  const value = readOption(name);
  return value === undefined ? fallback : Number(value);
};
const filter = args.find((arg, index) => !arg.startsWith("--") && !args[index - 1]?.startsWith("--"));
const iterations = readFlag("--iterations", 200);
const warmup = readFlag("--warmup", 20);
const top = readFlag("--top", 15);
const withCpuProfile = args.includes("--cpu");
const baselineRef = readOption("--baseline");

const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) {
  console.warn("Run with --expose-gc (pnpm bench:profile does) for heap measurements.");
}

const collect = () => {
  gc?.();
  gc?.();
};

const rootDir = process.cwd();

// Profile the bundled scenarios: see bundleEntry for why tsx is not used here.
const bundlePath = await bundleEntry("benchmarks/reactivity/scenarios.ts", "reactivity-scenarios");
const bundleUrl = pathToFileURL(bundlePath).href;
const mapPosition = await loadSourceMap(bundlePath);
type ScenariosModule = typeof import("./scenarios");
const { BenchDisplayObject, selectScenarios } = (await import(bundleUrl)) as ScenariosModule;
const baseline = baselineRef
  ? ((await import(
    pathToFileURL(await bundleEntry("benchmarks/reactivity/scenarios.ts", "reactivity-scenarios-baseline", { ref: baselineRef })).href
  )) as ScenariosModule)
  : null;

/** Groups a script url into a readable package / source bucket. */
function bucketOf(url: string): string {
  if (!url) return "(native)";
  const clean = url.replace(/^file:\/\//, "");
  const match = clean.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/);
  if (match) return match[1];
  if (clean.startsWith(rootDir)) return path.relative(rootDir, clean);
  return clean.startsWith("node:") ? "(node)" : clean;
}

function summariseProfile(profile: CpuProfile) {
  const totalMs = (profile.endTime - profile.startTime) / 1000;
  const totalSamples = profile.samples?.length
    ?? profile.nodes.reduce((sum, node) => sum + (node.hitCount ?? 0), 0);
  const msPerSample = totalSamples ? totalMs / totalSamples : 0;

  const byFunction = new Map<string, number>();
  const byBucket = new Map<string, number>();

  for (const node of profile.nodes) {
    const hits = node.hitCount ?? 0;
    if (!hits) continue;
    const { functionName, url, lineNumber, columnNumber } = node.callFrame;
    const original = url === bundleUrl ? mapPosition(lineNumber, columnNumber) : null;
    const bucket = url === bundleUrl && !original
      ? "(bundler runtime)"
      : bucketOf(original ? pathToFileURL(original.source).href : url);
    const line = original ? original.line : lineNumber + 1;
    const location = url ? `${bucket}:${line}` : bucket;
    const key = `${functionName || "(anonymous)"} ${location}`;
    byFunction.set(key, (byFunction.get(key) ?? 0) + hits);
    byBucket.set(bucket, (byBucket.get(bucket) ?? 0) + hits);
  }

  const rank = (map: Map<string, number>, limit: number) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, hits]) => ({
        name,
        selfMs: roundMetric(hits * msPerSample, 2),
        percent: roundMetric((hits / totalSamples) * 100, 1),
      }));

  return {
    totalMs: roundMetric(totalMs, 2),
    topFunctions: rank(byFunction, top),
    byPackage: rank(byBucket, 10),
  };
}

async function profileScenario(scenario: Scenario, session: Session | null, outputDir: string) {
  for (let index = 0; index < warmup; index++) scenario.run();

  collect();
  const liveBefore = BenchDisplayObject.live;
  const destroyCallsBefore = BenchDisplayObject.destroyCalls;
  const heapBefore = process.memoryUsage().heapUsed;

  if (session) {
    await session.post("Profiler.enable");
    await session.post("Profiler.setSamplingInterval", { interval: 100 });
    await session.post("Profiler.start");
  }

  const durations: number[] = [];
  for (let index = 0; index < iterations; index++) {
    const start = performance.now();
    scenario.run();
    durations.push(performance.now() - start);
  }

  let cpu: ReturnType<typeof summariseProfile> | null = null;
  let cpuProfilePath: string | null = null;
  if (session) {
    const { profile } = (await session.post("Profiler.stop")) as { profile: CpuProfile };
    await session.post("Profiler.disable");
    cpu = summariseProfile(profile);
    cpuProfilePath = path.join(outputDir, `${scenario.name.replace(/[^a-z0-9-]+/gi, "_")}.cpuprofile`);
    await writeFile(cpuProfilePath, JSON.stringify(profile), "utf8");
  }

  collect();
  const heapAfter = process.memoryUsage().heapUsed;
  const mean = durations.reduce((sum, value) => sum + value, 0) / durations.length;

  return {
    name: scenario.name,
    description: scenario.description,
    metrics: {
      iterations,
      medianMs: roundMetric(percentile(durations, 50), 4),
      p95Ms: roundMetric(percentile(durations, 95), 4),
      meanMs: roundMetric(mean, 4),
      minMs: roundMetric(Math.min(...durations), 4),
      retainedKbPerIteration: gc ? roundMetric((heapAfter - heapBefore) / 1024 / iterations, 3) : null,
      leakedInstances: BenchDisplayObject.live - liveBefore,
      destroyCallsPerIteration: roundMetric((BenchDisplayObject.destroyCalls - destroyCallsBefore) / iterations, 2),
    },
    cpu,
    cpuProfilePath: cpuProfilePath ? path.relative(rootDir, cpuProfilePath) : null,
  };
}

type Side = {
  module: ScenariosModule;
  scenario: Scenario;
  durations: number[];
  liveBefore: number;
  destroyCallsBefore: number;
};

const sideMetrics = (side: Side) => ({
  medianMs: roundMetric(percentile(side.durations, 50), 4),
  p95Ms: roundMetric(percentile(side.durations, 95), 4),
  minMs: roundMetric(Math.min(...side.durations), 4),
  leakedInstances: side.module.BenchDisplayObject.live - side.liveBefore,
  destroyCallsPerIteration: roundMetric(
    (side.module.BenchDisplayObject.destroyCalls - side.destroyCallsBefore) / side.durations.length,
    2
  ),
});

/** Runs the candidate and the baseline interleaved (A B B A ...). */
function compareScenario(scenario: Scenario, baselineModule: ScenariosModule) {
  const baselineScenario = baselineModule.scenarios.find((entry) => entry.name === scenario.name);
  if (!baselineScenario) return null;

  const sides: Side[] = [
    { module: { BenchDisplayObject } as ScenariosModule, scenario },
    { module: baselineModule, scenario: baselineScenario },
  ].map(({ module, scenario: sideScenario }) => {
    for (let index = 0; index < warmup; index++) sideScenario.run();
    return {
      module,
      scenario: sideScenario,
      durations: [],
      liveBefore: module.BenchDisplayObject.live,
      destroyCallsBefore: module.BenchDisplayObject.destroyCalls,
    };
  });

  collect();
  for (let index = 0; index < iterations; index++) {
    const order = index % 2 === 0 ? sides : [...sides].reverse();
    for (const side of order) {
      const start = performance.now();
      side.scenario.run();
      side.durations.push(performance.now() - start);
    }
  }

  const [candidate, base] = sides.map(sideMetrics);
  return {
    name: scenario.name,
    description: scenario.description,
    metrics: {
      iterations,
      ...candidate,
      baselineMedianMs: base.medianMs,
      baselineP95Ms: base.p95Ms,
      baselineLeakedInstances: base.leakedInstances,
      baselineDestroyCallsPerIteration: base.destroyCallsPerIteration,
      speedup: roundMetric(base.medianMs / candidate.medianMs, 3),
    },
  };
}

const selected = selectScenarios(filter);
if (selected.length === 0) {
  console.error(`No scenario matches "${filter}".`);
  process.exit(1);
}

const generatedAt = new Date().toISOString();
const outputDir = path.resolve("benchmarks", "results", "profile", generatedAt.replace(/[:.]/g, "-"));
if (withCpuProfile) await mkdir(outputDir, { recursive: true });

const session = withCpuProfile ? new Session() : null;
session?.connect();

const results = [];

if (baseline) {
  if (withCpuProfile) console.warn("--cpu is ignored with --baseline: profile each side separately.");
  console.log(`Comparing working tree (candidate) with ${baselineRef} (baseline), interleaved.\n`);
  console.log("scenario | median ms (candidate / baseline) | speedup | p95 ms (candidate / baseline) | destroy calls/iter | leaked instances");
  for (const scenario of selected) {
    const result = compareScenario(scenario, baseline);
    if (!result) {
      console.log(`${scenario.name} | not in baseline`);
      continue;
    }
    results.push(result);
    const m = result.metrics;
    console.log(
      `${m.speedup >= 1 ? " " : "!"} ${result.name} | ${m.medianMs} / ${m.baselineMedianMs} | ${m.speedup}x` +
      ` | ${m.p95Ms} / ${m.baselineP95Ms} | ${m.destroyCallsPerIteration} / ${m.baselineDestroyCallsPerIteration}` +
      ` | ${m.leakedInstances} / ${m.baselineLeakedInstances}`
    );
  }
}

for (const scenario of baseline ? [] : selected) {
  const result = await profileScenario(scenario, session, outputDir);
  results.push(result);

  const m = result.metrics;
  console.log(`\n${result.name}  (${result.description})`);
  console.log(
    `  median ${m.medianMs} ms | p95 ${m.p95Ms} ms | min ${m.minMs} ms` +
    ` | retained ${m.retainedKbPerIteration ?? "n/a"} KB/iter` +
    ` | leaked instances ${m.leakedInstances} | destroy calls/iter ${m.destroyCallsPerIteration}`
  );
  if (result.cpu) {
    console.log("  self time by package:");
    for (const entry of result.cpu.byPackage) {
      console.log(`    ${String(entry.percent).padStart(5)}%  ${entry.selfMs} ms  ${entry.name}`);
    }
    console.log("  top functions (self time):");
    for (const entry of result.cpu.topFunctions) {
      console.log(`    ${String(entry.percent).padStart(5)}%  ${entry.name}`);
    }
    console.log(`  profile: ${result.cpuProfilePath}`);
  }
}

session?.disconnect();

const report: BenchmarkReport = {
  suite: "profile",
  generatedAt,
  environment: getEnvironment({
    runner: "profile",
    iterations,
    warmup,
    filter: filter ?? null,
    baseline: baselineRef ?? null,
  }),
  benchmarks: results,
};
const reportPath = await writeReport(report);
console.log(`\nReport written to ${reportPath}`);
