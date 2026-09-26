import { defineConfig, type Plugin, type UserConfig } from "vite";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import canvasengine, { shaderLoader } from "../../packages/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const engineSources = path.resolve(repoRoot, "packages/core/src") + path.sep;

/** Serves the engine sources (`packages/core/src`) as they are at a git ref. */
function engineAtRef(ref: string): Plugin {
  return {
    name: "engine-at-ref",
    enforce: "pre",
    load(id) {
      const file = id.split("?")[0];
      if (!file.startsWith(engineSources)) return null;
      const relative = path.relative(repoRoot, file).split(path.sep).join("/");
      try {
        return execFileSync("git", ["show", `${ref}:${relative}`], {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        // File added after `ref`: use the working tree version
        return null;
      }
    },
  };
}

/**
 * @param ref - Git ref of the engine to benchmark; the working tree when omitted.
 * Files missing at `ref` (untracked, or added later) come from the working tree.
 */
export function createTeardownConfig(ref?: string): UserConfig {
  return {
    configFile: false,
    root: __dirname,
    cacheDir: path.resolve(repoRoot, "node_modules/.vite-teardown", ref ? ref.replace(/[^a-z0-9]+/gi, "_") : "worktree"),
    plugins: [...(ref ? [engineAtRef(ref)] : []), canvasengine(), shaderLoader()],
    resolve: {
      alias: {
        canvasengine: path.resolve(repoRoot, "packages/core/src/index.ts"),
        "@chenglou/pretext": path.resolve(repoRoot, "packages/core/node_modules/@chenglou/pretext/dist/layout.js"),
      },
    },
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, strictPort: false },
  };
}

export default defineConfig(createTeardownConfig(process.env.BENCH_ENGINE_REF));
