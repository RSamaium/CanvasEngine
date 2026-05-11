import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

type Report = {
  suite: string;
  environment?: {
    hash?: string;
  };
  benchmarks: Array<{
    name?: string;
    scenario?: string;
    metrics?: Record<string, number>;
    validity?: {
      valid?: boolean;
    };
  }>;
};

type Comparison = {
  name: string;
  metric: string;
  current: number;
  baseline: number;
  regression: number;
  threshold: number;
};

const lowerIsBetter = new Set([
  "meanMs",
  "minMs",
  "maxMs",
  "p75Ms",
  "p99Ms",
  "frameTimeMeanMs",
  "frameTimeP50Ms",
  "frameTimeP95Ms",
  "frameTimeP99Ms",
  "droppedFrames",
  "longTasks",
  "longTaskMaxMs",
  "updateTimeMeanMs",
  "updateTimeP95Ms",
]);

const higherIsBetter = new Set(["hz", "averageFps"]);

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getThreshold(): number {
  return Number(getArg("--threshold") ?? process.env.BENCH_COMPARE_THRESHOLD ?? 0.15);
}

async function readReport(filePath: string): Promise<Report> {
  return JSON.parse(await readFile(filePath, "utf8")) as Report;
}

function benchmarkKey(benchmark: Report["benchmarks"][number]): string {
  return String(benchmark.name ?? benchmark.scenario);
}

function compareReports(current: Report, baseline: Report, threshold: number): Comparison[] {
  const failures: Comparison[] = [];
  const baselineByName = new Map(baseline.benchmarks.map((benchmark) => [benchmarkKey(benchmark), benchmark]));

  for (const currentBenchmark of current.benchmarks) {
    if (currentBenchmark.validity?.valid === false) {
      continue;
    }

    const name = benchmarkKey(currentBenchmark);
    const baselineBenchmark = baselineByName.get(name);
    if (!baselineBenchmark?.metrics || !currentBenchmark.metrics) {
      continue;
    }

    for (const [metric, currentValue] of Object.entries(currentBenchmark.metrics)) {
      const baselineValue = baselineBenchmark.metrics[metric];
      if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue) || baselineValue === 0) {
        continue;
      }

      let regression = 0;
      if (lowerIsBetter.has(metric)) {
        regression = (currentValue - baselineValue) / baselineValue;
      } else if (higherIsBetter.has(metric)) {
        regression = (baselineValue - currentValue) / baselineValue;
      } else {
        continue;
      }

      if (regression > threshold) {
        failures.push({
          name,
          metric,
          current: currentValue,
          baseline: baselineValue,
          regression,
          threshold,
        });
      }
    }
  }

  return failures;
}

async function comparePair(currentPath: string, baselinePath: string, threshold: number): Promise<number> {
  if (!existsSync(currentPath)) {
    console.warn(`Skipping ${currentPath}: current report not found.`);
    return 0;
  }
  if (!existsSync(baselinePath)) {
    console.warn(`Skipping ${baselinePath}: baseline report not found.`);
    return 0;
  }

  const current = await readReport(currentPath);
  const baseline = await readReport(baselinePath);

  if (current.environment?.hash && baseline.environment?.hash && current.environment.hash !== baseline.environment.hash) {
    console.warn(
      `Environment hash differs for ${current.suite}: current=${current.environment.hash}, baseline=${baseline.environment.hash}`
    );
  }

  const failures = compareReports(current, baseline, threshold);
  if (failures.length === 0) {
    console.log(`${current.suite}: no regression above ${Math.round(threshold * 100)}%.`);
    return 0;
  }

  console.error(`${current.suite}: ${failures.length} regression(s) above ${Math.round(threshold * 100)}%.`);
  for (const failure of failures) {
    console.error(
      `- ${failure.name} ${failure.metric}: current=${failure.current}, baseline=${failure.baseline}, regression=${Math.round(failure.regression * 10000) / 100}%`
    );
  }
  return failures.length;
}

const threshold = getThreshold();
const explicitCurrent = getArg("--current");
const explicitBaseline = getArg("--baseline");

let failureCount = 0;

if (explicitCurrent || explicitBaseline) {
  if (!explicitCurrent || !explicitBaseline) {
    throw new Error("Both --current and --baseline are required when using explicit compare paths.");
  }
  failureCount += await comparePair(explicitCurrent, explicitBaseline, threshold);
} else {
  failureCount += await comparePair(
    path.resolve("benchmarks", "results", "reactivity", "latest.json"),
    path.resolve("benchmarks", "baselines", "reactivity.json"),
    threshold
  );
  failureCount += await comparePair(
    path.resolve("benchmarks", "results", "render", "latest.json"),
    path.resolve("benchmarks", "baselines", "render.json"),
    threshold
  );
}

if (failureCount > 0) {
  process.exitCode = 1;
}
