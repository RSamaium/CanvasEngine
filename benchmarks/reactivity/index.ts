import { Bench } from "tinybench";
import { pathToFileURL } from "node:url";
import { bundleEntry } from "../shared/bundle";
import {
  coefficientOfVariation,
  formatSummary,
  getEnvironment,
  roundMetric,
  writeReport,
  type BenchmarkReport,
  type ValidityMarker,
} from "../shared/report";

const time = Number(process.env.BENCH_REACTIVITY_TIME_MS ?? 2000);
const warmupTime = Number(process.env.BENCH_REACTIVITY_WARMUP_MS ?? 1000);
const filter = process.env.BENCH_REACTIVITY_FILTER;

// Measure the bundled scenarios: see bundleEntry for why tsx is not used here.
const bundlePath = await bundleEntry("benchmarks/reactivity/scenarios.ts", "reactivity-scenarios");
const { selectScenarios } = (await import(pathToFileURL(bundlePath).href)) as typeof import("./scenarios");

const bench = new Bench({
  time,
  warmupTime,
});

for (const scenario of selectScenarios(filter)) {
  bench.add(scenario.name, scenario.run);
}

function getValidity(result: NonNullable<(typeof bench.tasks)[number]["result"]>): ValidityMarker {
  const samples = result.samples ?? [];
  const cv = coefficientOfVariation(samples);
  const reasons: string[] = [];

  if (samples.length < 30) {
    reasons.push("sample-count-low");
  }
  if (result.rme > 10) {
    reasons.push("relative-margin-of-error-high");
  }
  if (cv > 0.5) {
    reasons.push("coefficient-of-variation-high");
  }

  return {
    valid: reasons.length === 0,
    reasons,
    sampleCount: samples.length,
    relativeMarginOfError: roundMetric(result.rme, 4),
    coefficientOfVariation: roundMetric(cv, 4),
    warmupStable: true,
  };
}

await bench.run();

const report: BenchmarkReport = {
  suite: "reactivity",
  generatedAt: new Date().toISOString(),
  environment: getEnvironment({
    runner: "tinybench",
    time,
    warmupTime,
    filter: filter ?? null,
  }),
  benchmarks: bench.tasks.map((task) => {
    const result = task.result!;
    return {
      name: task.name,
      metrics: {
        hz: roundMetric(result.hz, 2),
        meanMs: roundMetric(result.mean, 6),
        minMs: roundMetric(result.min, 6),
        maxMs: roundMetric(result.max, 6),
        p75Ms: roundMetric(result.p75, 6),
        p99Ms: roundMetric(result.p99, 6),
        rme: roundMetric(result.rme, 4),
        sampleCount: result.samples.length,
      },
      validity: getValidity(result),
    };
  }),
};

const reportPath = await writeReport(report);
console.log(formatSummary(report));
console.log(`Report written to ${reportPath}`);
