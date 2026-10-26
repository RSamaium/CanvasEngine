/**
 * Compiles `.ce` components with nothing of Node: no file is read, nothing comes from Vite, and no code is generated from text, so it
 * runs in a browser and in a Worker (a Cloudflare Worker does not allow `eval`). The template parser was generated before.
 *
 * @example
 * ```ts
 * import { compile } from "@canvasengine/compiler/browser"
 *
 * const { code } = compile(`<Text text="Hello" />`, "hello.ce")
 * ```
 */
import { compileCe, type CompileCeOptions } from "./src/compile";
import { parse } from "./src/template-parser.generated.js";

export type { CompileCeOptions, TemplateParser } from "./src/compile";
export type { CompileMetadata, CompilerDiagnostic } from "./src/types";

/** What `compile` can be given besides the source: the parser is always the pre-generated one. */
export type CompileOptions = Omit<CompileCeOptions, "parser">;

/**
 * Compiles a component.
 *
 * @param source - The source of the component (`<Template />`, then an optional `<script>` and `<style>`).
 * @param id - What names the component: its path. Default: `component.ce`.
 * @param options - `transpile` to strip the types of a TypeScript script, `scopeStyles` for a `<style scoped>`, `runtime` for the
 * module the runtime is imported from (default `canvasengine`).
 * @returns The JavaScript of the component (`code`, an ES module whose default export is the component), a source map and what the
 * component uses of the runtime (`metadata`).
 * @throws An error that tells the line and the column of a template that is wrong.
 */
export function compile(source: string, id = "component.ce", options: CompileOptions = {}) {
  return compileCe(source, id, { ...options, parser: { parse } });
}
