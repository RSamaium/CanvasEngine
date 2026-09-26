import path from "node:path";
import { roundMetric } from "./report";

export type CpuProfileNode = {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number; columnNumber: number };
  hitCount?: number;
  children?: number[];
};

export type CpuProfile = {
  nodes: CpuProfileNode[];
  startTime: number;
  endTime: number;
  samples?: number[];
};

/** Where a profiled function comes from: a package or a source file, and a line. */
export type FrameLocation = { bucket: string; line: number };

export type ResolveFrame = (callFrame: CpuProfileNode["callFrame"]) => FrameLocation | null;

/** Self time accumulated per function and per package / file. */
export class CpuProfileSummary {
  #byFunction = new Map<string, number>();
  #inclusive = new Map<string, number>();
  #byBucket = new Map<string, number>();
  #totalMs = 0;

  constructor(private resolve: ResolveFrame = defaultResolveFrame) {}

  add(profile: CpuProfile) {
    const durationMs = (profile.endTime - profile.startTime) / 1000;
    const totalSamples = profile.samples?.length
      ?? profile.nodes.reduce((sum, node) => sum + (node.hitCount ?? 0), 0);
    if (!totalSamples) return;
    const msPerSample = durationMs / totalSamples;
    this.#totalMs += durationMs;

    const keys = new Map<number, string>();
    for (const node of profile.nodes) {
      const { functionName, url } = node.callFrame;
      const location = this.resolve(node.callFrame) ?? defaultResolveFrame(node.callFrame)!;
      keys.set(node.id, `${functionName || "(anonymous)"} ${url ? `${location.bucket}:${location.line}` : location.bucket}`);
      const hits = node.hitCount ?? 0;
      if (!hits) continue;
      const selfMs = hits * msPerSample;
      const key = keys.get(node.id)!;
      this.#byFunction.set(key, (this.#byFunction.get(key) ?? 0) + selfMs);
      this.#byBucket.set(location.bucket, (this.#byBucket.get(location.bucket) ?? 0) + selfMs);
    }

    // Inclusive time: a sample counts once for every distinct function on
    // its stack (recursion is not counted twice).
    const byId = new Map(profile.nodes.map((node) => [node.id, node]));
    const root = profile.nodes[0];
    const onStack = new Map<string, number>();
    const walk = (node: CpuProfileNode) => {
      const key = keys.get(node.id)!;
      onStack.set(key, (onStack.get(key) ?? 0) + 1);
      const hits = node.hitCount ?? 0;
      if (hits) {
        for (const stackKey of onStack.keys()) {
          this.#inclusive.set(stackKey, (this.#inclusive.get(stackKey) ?? 0) + hits * msPerSample);
        }
      }
      for (const childId of node.children ?? []) {
        const child = byId.get(childId);
        if (child) walk(child);
      }
      const count = onStack.get(key)! - 1;
      if (count) onStack.set(key, count);
      else onStack.delete(key);
    };
    if (root) walk(root);
  }

  summary(top = 15) {
    const rank = (map: Map<string, number>, limit: number) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, selfMs]) => ({
          name,
          selfMs: roundMetric(selfMs, 2),
          percent: roundMetric(this.#totalMs ? (selfMs / this.#totalMs) * 100 : 0, 1),
        }));

    const inclusive = new Map(
      [...this.#inclusive.entries()].filter(([key]) => !key.startsWith("(root)") && !key.startsWith("(program)"))
    );
    return {
      totalMs: roundMetric(this.#totalMs, 2),
      topFunctions: rank(this.#byFunction, top),
      topInclusive: rank(inclusive, top),
      byPackage: rank(this.#byBucket, 10),
    };
  }
}

/**
 * Groups a script url into a readable bucket: a package name for
 * dependencies (node_modules or Vite pre-bundled deps), a path relative to
 * the repository for sources.
 */
export function bucketOfUrl(url: string, rootDir = process.cwd()): string {
  if (!url) return "(native)";
  let clean = url.replace(/^file:\/\//, "").replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  clean = clean.replace(/^\/@fs/, "");

  const viteDep = clean.match(/\/\.vite(?:-[^/]+)?\/(?:[^/]+\/)*deps\/([^/]+?)(?:-[A-Za-z0-9_]{8})?\.js$/);
  if (viteDep) return viteDep[1].replace(/__/g, "/").replace(/_/g, ".");
  const nodeModule = clean.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/);
  if (nodeModule) return nodeModule[1];
  if (clean.startsWith(rootDir)) return path.relative(rootDir, clean);
  if (clean.startsWith("node:")) return "(node)";
  return clean.replace(/^\//, "");
}

export const defaultResolveFrame: ResolveFrame = ({ url, lineNumber }) => ({
  bucket: bucketOfUrl(url),
  line: lineNumber + 1,
});

export function printCpuSummary(
  summary: Omit<ReturnType<CpuProfileSummary["summary"]>, "topInclusive"> & {
    topInclusive?: ReturnType<CpuProfileSummary["summary"]>["topInclusive"];
  },
  indent = "  "
) {
  console.log(`${indent}self time by package:`);
  for (const entry of summary.byPackage) {
    console.log(`${indent}  ${String(entry.percent).padStart(5)}%  ${entry.selfMs} ms  ${entry.name}`);
  }
  console.log(`${indent}top functions (self time):`);
  for (const entry of summary.topFunctions) {
    console.log(`${indent}  ${String(entry.percent).padStart(5)}%  ${entry.selfMs} ms  ${entry.name}`);
  }
  if (summary.topInclusive) {
    console.log(`${indent}top functions (inclusive time):`);
    for (const entry of summary.topInclusive) {
      console.log(`${indent}  ${String(entry.percent).padStart(5)}%  ${entry.selfMs} ms  ${entry.name}`);
    }
  }
}
