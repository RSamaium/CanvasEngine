import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export type ValidityMarker = {
  valid: boolean;
  reasons: string[];
  sampleCount?: number;
  relativeMarginOfError?: number;
  coefficientOfVariation?: number;
  warmupStable?: boolean;
  assetReady?: boolean;
  deterministicSeed?: number;
};

export type BenchmarkReport = {
  suite: string;
  generatedAt: string;
  environment: Record<string, unknown>;
  benchmarks: Array<Record<string, unknown>>;
  comparisons?: Array<Record<string, unknown>>;
};

export function getGitCommit(): string | null {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

export function getEnvironment(extra: Record<string, unknown> = {}) {
  const env = {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().map((cpu) => cpu.model),
    cpuCount: os.cpus().length,
    totalMemory: os.totalmem(),
    commit: getGitCommit(),
    ...extra,
  };

  const hash = createHash("sha256")
    .update(JSON.stringify(env))
    .digest("hex")
    .slice(0, 16);

  return {
    ...env,
    hash,
  };
}

export function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

export function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function roundMetric(value: number, digits = 4): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function writeReport(report: BenchmarkReport): Promise<string> {
  const resultsDir = path.resolve("benchmarks", "results", report.suite);
  await mkdir(resultsDir, { recursive: true });

  const safeTimestamp = report.generatedAt.replace(/[:.]/g, "-");
  const reportPath = path.join(resultsDir, `${safeTimestamp}.json`);
  const markdownPath = path.join(resultsDir, `${safeTimestamp}.md`);
  const latestPath = path.join(resultsDir, "latest.json");
  const latestMarkdownPath = path.join(resultsDir, "latest.md");
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = toMarkdown(report);

  await writeFile(reportPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");
  await writeFile(markdownPath, markdown, "utf8");
  await writeFile(latestMarkdownPath, markdown, "utf8");

  return reportPath;
}

function toMarkdown(report: BenchmarkReport): string {
  const lines = [
    `# ${report.suite} benchmark`,
    "",
    `Generated at: ${report.generatedAt}`,
    `Environment hash: ${String(report.environment.hash ?? "unknown")}`,
    "",
    "| Benchmark | Primary | Validity | Markers |",
    "| --- | ---: | --- | --- |",
  ];

  for (const benchmark of report.benchmarks) {
    const name = String(benchmark.name ?? benchmark.scenario ?? "unnamed");
    const metrics = benchmark.metrics as Record<string, unknown> | undefined;
    const validity = benchmark.validity as ValidityMarker | undefined;
    const primary =
      typeof metrics?.hz === "number"
        ? `${roundMetric(metrics.hz, 2)} ops/sec`
        : typeof metrics?.averageFps === "number"
          ? `${roundMetric(metrics.averageFps, 2)} fps`
          : "measured";
    const status = validity?.valid === false ? "unstable" : "valid";
    const markers = validity?.reasons?.length ? validity.reasons.join(", ") : "none";

    lines.push(`| ${name} | ${primary} | ${status} | ${markers} |`);
  }

  if (report.comparisons?.length) {
    lines.push("", "## Comparisons", "", "| Scenario | Baseline | Candidate | FPS ratio | p95 frame ratio | Update p95 ratio |");
    lines.push("| --- | --- | --- | ---: | ---: | ---: |");

    for (const comparison of report.comparisons) {
      lines.push(
        `| ${String(comparison.scenario)} | ${String(comparison.baseline)} | ${String(comparison.candidate)} | ${String(comparison.averageFpsRatio)} | ${String(comparison.frameTimeP95Ratio)} | ${String(comparison.updateTimeP95Ratio)} |`
      );
    }
  }

  lines.push("", "## Environment", "", "```json", JSON.stringify(report.environment, null, 2), "```", "");
  return lines.join("\n");
}

export function formatSummary(report: BenchmarkReport): string {
  const lines = [`${report.suite}: ${report.benchmarks.length} benchmark(s)`];

  for (const benchmark of report.benchmarks) {
    const name = String(benchmark.name ?? benchmark.scenario ?? "unnamed");
    const metrics = benchmark.metrics as Record<string, unknown> | undefined;
    const validity = benchmark.validity as ValidityMarker | undefined;
    const status = validity?.valid === false ? "unstable" : "valid";
    const primary =
      typeof metrics?.hz === "number"
        ? `${roundMetric(metrics.hz, 2)} ops/sec`
        : typeof metrics?.averageFps === "number"
          ? `${roundMetric(metrics.averageFps, 2)} fps`
          : "measured";

    lines.push(`- ${name}: ${primary} (${status})`);
  }

  return lines.join("\n");
}
