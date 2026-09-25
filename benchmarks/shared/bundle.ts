import { build, type Plugin } from "esbuild";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ENGINE_SOURCES = /packages[\\/]core[\\/]src[\\/].*\.ts$/;

/**
 * Loads the engine sources (`packages/core/src`) as they are at a git ref, so
 * a baseline and the working tree can be bundled and compared side by side.
 */
function engineAtRef(ref: string): Plugin {
  const root = process.cwd();
  return {
    name: "engine-at-ref",
    setup(pluginBuild) {
      pluginBuild.onLoad({ filter: ENGINE_SOURCES }, (args) => {
        const relative = path.relative(root, args.path).split(path.sep).join("/");
        try {
          const contents = execFileSync("git", ["show", `${ref}:${relative}`], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          });
          return { contents, loader: "ts", resolveDir: path.dirname(args.path) };
        } catch {
          // File added after `ref`: use the working tree version
          return undefined;
        }
      });
    },
  };
}

/**
 * Bundles a benchmark entry the way the library ships (esbuild, no
 * `keepNames`) and returns its path.
 *
 * Running the sources through tsx instead injects a `__name()` helper around
 * every closure, which calls `Object.defineProperty` each time a closure is
 * created. In `createComponent` that helper alone showed up as ~70% of the
 * profile, hiding the real engine costs.
 *
 * With `ref`, the engine sources are taken from that git ref instead of the
 * working tree.
 */
export async function bundleEntry(
  entry: string,
  name: string,
  options: { ref?: string } = {}
): Promise<string> {
  const outfile = path.resolve("benchmarks", "results", ".build", `${name}.mjs`);
  await build({
    entryPoints: [path.resolve(entry)],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    sourcemap: "external",
    keepNames: false,
    minify: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: options.ref ? [engineAtRef(options.ref)] : [],
  });
  return outfile;
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

type Segment = [generatedColumn: number, source: number, line: number, column: number];

/**
 * Maps positions of a bundle back to the original sources, from the
 * `.map` file written by `bundleEntry`.
 */
export async function loadSourceMap(bundlePath: string) {
  const map = JSON.parse(await readFile(`${bundlePath}.map`, "utf8")) as {
    sources: string[];
    mappings: string;
  };
  const bundleDir = path.dirname(bundlePath);
  const sources = map.sources.map((source) => path.resolve(bundleDir, source));

  const lines: Segment[][] = [];
  let source = 0;
  let line = 0;
  let column = 0;

  for (const encodedLine of map.mappings.split(";")) {
    const segments: Segment[] = [];
    let generatedColumn = 0;
    for (const encoded of encodedLine.split(",")) {
      if (!encoded) continue;
      const values: number[] = [];
      let value = 0;
      let shift = 0;
      for (const char of encoded) {
        const digit = BASE64.indexOf(char);
        value += (digit & 31) << shift;
        if (digit & 32) {
          shift += 5;
        } else {
          values.push(value & 1 ? -(value >> 1) : value >> 1);
          value = 0;
          shift = 0;
        }
      }
      generatedColumn += values[0];
      if (values.length >= 4) {
        source += values[1];
        line += values[2];
        column += values[3];
        segments.push([generatedColumn, source, line, column]);
      }
    }
    lines.push(segments);
  }

  /** `line` and `column` are 0-based, as in V8 CPU profiles. */
  return (generatedLine: number, generatedColumn: number) => {
    const segments = lines[generatedLine];
    if (!segments?.length) return null;
    let match = segments[0];
    for (const segment of segments) {
      if (segment[0] > generatedColumn) break;
      match = segment;
    }
    return { source: sources[match[1]], line: match[2] + 1, column: match[3] + 1 };
  };
}
