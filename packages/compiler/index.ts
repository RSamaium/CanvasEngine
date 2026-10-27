import { createFilter } from "vite";
import fs from "fs";
import pkg from "peggy";
import path from "path";
import * as ts from "typescript";
import { fileURLToPath } from 'url';
import { compileCe } from "./src/compile";
import { scopeStyles } from "./src/style";

export type {
  CompileMetadata,
  CompileResult,
  CompilerDiagnostic,
  SfcAttributeValue,
  SfcBlock,
  SfcDescriptor,
  SourcePosition,
  SourceSpan,
  TemplateProgram,
} from "./src/types";

const { generate } = pkg;

const DEV_SRC = "../../src"
let cachedTemplateParser: any;

function getTemplateParser(): any {
  if (cachedTemplateParser) return cachedTemplateParser;

  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  const grammar = fs.readFileSync(path.join(dirname, "grammar2.pegjs"), "utf8");
  cachedTemplateParser = generate(grammar);
  return cachedTemplateParser;
}

export type ManualChunksFunction = (id: string, meta: any) => string | void;
export type ManualChunksOption = ManualChunksFunction | Record<string, string[]>;

function normalizeModuleId(id: string): string {
  return id.replace(/\\/g, "/");
}

function matchesAnyModule(id: string, modules: string[]): boolean {
  return modules.some((moduleId) => id === moduleId || id.includes(moduleId));
}

/**
 * Groups CanvasEngine and Pixi runtime modules into stable production chunks.
 *
 * Pixi registers renderer extensions during module evaluation. Keeping Pixi and
 * CanvasEngine dependencies out of the app entry chunk avoids Rollup/Vite split
 * chunks that can create circular ESM initialization in production builds.
 */
export function canvasengineManualChunks(id: string): string | void {
  const normalizedId = normalizeModuleId(id);

  if (
    normalizedId.includes("/node_modules/pixi.js/") ||
    normalizedId.includes("/node_modules/.pnpm/pixi.js@") ||
    normalizedId.includes("/node_modules/@pixi/") ||
    normalizedId.includes("/node_modules/.pnpm/@pixi+") ||
    normalizedId.includes("/node_modules/pixi-") ||
    normalizedId.includes("/node_modules/.pnpm/pixi-")
  ) {
    return "pixi";
  }

  if (
    normalizedId.includes("/node_modules/canvasengine/") ||
    normalizedId.includes("/node_modules/.pnpm/canvasengine@") ||
    normalizedId.includes("/node_modules/@canvasengine/") ||
    normalizedId.includes("/node_modules/.pnpm/@canvasengine+")
  ) {
    return "canvasengine";
  }
}

function callManualChunks(manualChunks: ManualChunksOption | undefined, id: string, meta: any): string | void {
  if (!manualChunks) return;

  if (typeof manualChunks === "function") {
    return manualChunks(id, meta);
  }

  const normalizedId = normalizeModuleId(id);
  for (const [chunkName, modules] of Object.entries(manualChunks)) {
    if (matchesAnyModule(normalizedId, modules.map(normalizeModuleId))) {
      return chunkName;
    }
  }
}

export function withCanvasEngineManualChunks(
  manualChunks?: ManualChunksOption
): ManualChunksFunction {
  return (id, meta) => {
    return canvasengineManualChunks(id) ?? callManualChunks(manualChunks, id, meta);
  };
}

function applyCanvasEngineManualChunks(config: any): void {
  config.build ??= {};
  config.build.rollupOptions ??= {};

  const output = config.build.rollupOptions.output;
  const applyToOutput = (outputOptions: any = {}) => ({
    ...outputOptions,
    manualChunks: withCanvasEngineManualChunks(outputOptions.manualChunks),
  });

  config.build.rollupOptions.output = Array.isArray(output)
    ? output.map(applyToOutput)
    : applyToOutput(output);
}


/**
 * Vite plugin to load shader files (.frag, .vert, .wgsl) as text strings
 * 
 * This plugin allows importing shader files directly as string literals in your code.
 * It supports fragment shaders (.frag), vertex shaders (.vert), and WebGPU shaders (.wgsl).
 * The content is loaded as a raw string and can be used directly with graphics APIs.
 * 
 * @returns {object} - Vite plugin configuration object
 * 
 * @example
 * ```typescript
 * // In your vite.config.ts
 * import { shaderLoader } from './path/to/compiler'
 * 
 * export default defineConfig({
 *   plugins: [shaderLoader()]
 * })
 * 
 * // In your code
 * import fragmentShader from './shader.frag'
 * import vertexShader from './shader.vert'
 * import computeShader from './shader.wgsl'
 * 
 * console.log(fragmentShader) // Raw shader code as string
 * ```
 */
export function shaderLoader() {
  const filter = createFilter(/\.(frag|vert|wgsl)$/);

  return {
    name: "vite-plugin-shader-loader",
    transform(code: string, id: string) {
      if (!filter(id)) return;

      // Escape the shader code to be safely embedded in a JavaScript string
      const escapedCode = code
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/`/g, '\\`')    // Escape backticks
        .replace(/\$/g, '\\$');  // Escape dollar signs

      // Return the shader content as a default export string
      return {
        code: `export default \`${escapedCode}\`;`,
        map: null,
      };
    },
  };
}

export interface CanvasEnginePluginOptions {
  /**
   * Wrap compiled `.ce` components with CanvasEngine hot component support in
   * dev. Set to false to let Vite reload the module/page instead.
   *
   * @default true
   */
  hmr?: boolean;
}

export default function canvasengine(options: CanvasEnginePluginOptions = {}) {
  const filter = createFilter("**/*.ce");
  const parser = getTemplateParser();
  const isDev = process.env.NODE_ENV === "dev";
  const useHmr = isDev && options.hmr !== false;

  return {
    name: "vite-plugin-ce",
    config(config: any, { command }: any) {
      if (command === "build") {
        applyCanvasEngineManualChunks(config);
      }
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null;

      return compileCe(code, id, {
        parser,
        transpile: (script) =>
          ts.transpileModule(script, {
            compilerOptions: {
              module: ts.ModuleKind.Preserve,
            },
          }).outputText,
        runtime: isDev ? DEV_SRC : "canvasengine",
        hot: useHmr,
        scopeStyles,
      });
    },
  };
}
