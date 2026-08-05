import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import canvasengine from "../index";
import { analyzeTemplateExpression } from "../src/analyze";
import { parseSfc } from "../src/sfc";
import { scopeStyles } from "../src/style";

describe("compiler pipeline", () => {
  test("splits template, script and scoped style blocks with source spans", () => {
    const source = `<Container />
<script lang="ts">
const closingTag = "</script>"
const value = 1
</script>
<style scoped>
.panel { color: red; }
</style>`;

    const descriptor = parseSfc(source, "/app/panel.ce");

    expect(descriptor.template.content).toBe("<Container />");
    expect(descriptor.script?.attributes).toEqual({ lang: "ts" });
    expect(descriptor.script?.content).toContain('const closingTag = "</script>"');
    expect(descriptor.script?.content).toContain("const value = 1");
    expect(descriptor.style?.attributes).toEqual({ scoped: true });
    expect(source.slice(descriptor.script!.contentSpan.start.offset, descriptor.script!.contentSpan.end.offset))
      .toBe(descriptor.script?.content);
  });

  test("reports an explicit diagnostic for an unclosed SFC block", () => {
    const source = `<Container />\n<script>\nconst value = 1`;

    expect(() => parseSfc(source, "/app/broken.ce")).toThrowError(
      /\[CE_SFC_UNCLOSED_BLOCK\].*<script>.*closing <\/script>/s,
    );
  });

  test("collects runtime helpers and primitive components from an ESTree expression", () => {
    const metadata = analyzeTemplateExpression(
      `h(Container, null, cond(show, () => loop(items, item => h(Text, { text: item }))))`
    );

    expect(metadata.runtimeHelpers).toEqual(["h", "cond", "loop"]);
    expect(metadata.primitiveComponents).toEqual(["Container", "Text"]);
  });

  test("does not infer primitive imports from string literals", () => {
    const metadata = analyzeTemplateExpression(`h(CustomComponent, { text: "h(Sprite)" })`);

    expect(metadata.primitiveComponents).toEqual([]);
  });

  test("parses every repository .ce fixture as an SFC descriptor", () => {
    const roots = ["sample", "starter", "benchmarks"];
    const files = roots.flatMap(root => collectCeFiles(root));

    expect(files.length).toBeGreaterThan(30);
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      const descriptor = parseSfc(source, path.resolve(file));
      expect(descriptor.template.content.length, file).toBeGreaterThan(0);
    }
  });

  test("compiles every repository .ce fixture through the Vite pipeline", () => {
    const files = ["sample", "starter", "benchmarks"].flatMap(root => collectCeFiles(root));
    const plugin = canvasengine({ hmr: false }) as any;

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      const result = plugin.transform(source, path.resolve(file));
      expect(result.code, file).toContain("export default __ce_component");
      expect(result.map, file).not.toBeNull();
    }
  });

  test("the Vite plugin keeps script closing-tag text inside strings", () => {
    const source = `<Container />
<script lang="ts">
const closingTag = "</script>"
const after = 42
</script>`;
    const result = (canvasengine({ hmr: false }) as any).transform(source, "/app/string.ce");

    expect(result.code).toContain('const closingTag = "</script>"');
    expect(result.code).toContain("const after = 42");
  });

  test("the Vite plugin derives helper and primitive imports from the AST", () => {
    const source = `<CustomComponent text={"h(Sprite)"} />
<script>
const CustomComponent = props => props
</script>`;
    const result = (canvasengine({ hmr: false }) as any).transform(source, "/app/imports.ce");

    expect(result.code).toContain("import { h } from 'canvasengine';");
    expect(result.code).not.toContain("computed");
    expect(result.code).not.toContain("cond, loop");
    expect(result.code).not.toContain("import { Sprite }");
    expect(result.diagnostics).toEqual([]);
    expect(result.metadata).toEqual({
      runtimeHelpers: ["h"],
      primitiveComponents: [],
    });
  });

  test("the Vite plugin returns a source map referencing the original .ce file", () => {
    const source = `<Container><Text text="Mapped" /></Container>`;
    const result = (canvasengine({ hmr: false }) as any).transform(source, "/app/mapped.ce");

    expect(result.map).not.toBeNull();
    expect(result.map.sources).toEqual(["/app/mapped.ce"]);
    expect(result.map.sourcesContent).toEqual([source]);
  });

  test("scopes complex selectors through a CSS AST", () => {
    const css = scopeStyles(
      `.panel:is(.active, .selected), button:hover { color: red; }`,
      "ce-panel",
      "/app/panel.ce",
    );

    expect(css).toContain(".ce-panel .panel:is(.active, .selected)");
    expect(css).toContain(".ce-panel button:hover");
  });

  test("scopes style rules nested in at-rules without changing keyframe selectors", () => {
    const css = scopeStyles(
      `@media (min-width: 1px) { .panel { color: blue; } }
       @keyframes pulse { from { opacity: 0; } to { opacity: 1; } }`,
      "ce-panel",
      "/app/panel.ce",
    );

    expect(css).toContain(".ce-panel .panel");
    expect(css).toContain("@keyframes pulse");
    expect(css).not.toContain(".ce-panel from");
    expect(css).not.toContain(".ce-panel to");
  });
});

function collectCeFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return collectCeFiles(file);
    return entry.isFile() && file.endsWith(".ce") ? [file] : [];
  });
}
