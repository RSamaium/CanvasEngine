import fs from "node:fs";
import * as ts from "typescript";
import pkg from "peggy";
import { describe, expect, test } from "vitest";
import canvasengine from "../index";
import { compile } from "../browser";
import { compileCe } from "../src/compile";
import { scopeStyles } from "../src/style";
import { parse } from "../src/template-parser.generated.js";

const grammar = fs.readFileSync("packages/compiler/grammar2.pegjs", "utf8");
const typescript = (code: string) => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.Preserve } }).outputText;

const SAMPLES: Record<string, string> = {
  simple: `<Container x={10} y={10}>
  <Text text={label()} size={14} color="#ffffff" />
  <Rect width={120} height={24} color="#17402f" />
</Container>

<script>
  import { signal } from 'canvasengine'
  const label = signal('Hello')
</script>`,
  control: `<Container>
  @if (open()) {
    <Text text="open" />
  }
  @for (item of items()) {
    <Text text={item.name} x={item.x} />
  }
</Container>

<script>
  import { signal } from 'canvasengine'
  const open = signal(true)
  const items = signal([{ name: 'a', x: 1 }])
</script>`,
  props: `<Container>
  <Text text={$props.title} />
</Container>

<script>
  const { title } = defineProps()
</script>`,
  style: `<Container />
<style>
  .panel { color: red; }
</style>`,
  scoped: `<DOMContainer>
  <div class="panel">hi</div>
</DOMContainer>
<style scoped>
  .panel { color: red; }
</style>`,
  typed: `<Text text={label()} />

<script lang="ts">
  import { signal } from 'canvasengine'
  const label = signal<string>('typed')
</script>`,
};

describe("compileCe: the compile of the Vite plugin, without Vite", () => {
  for (const [name, source] of Object.entries(SAMPLES)) {
    test(`gives the output of the plugin for the "${name}" component`, () => {
      const real = (canvasengine() as any).transform(source, `/app/${name}.ce`);

      const mine = compileCe(source, `/app/${name}.ce`, { parser: { parse }, transpile: typescript, scopeStyles });

      expect(mine.code).toBe(real.code);
    });
  }

  test("takes the runtime from where the host says", () => {
    const { code } = compileCe(SAMPLES.simple, "/app/a.ce", { parser: { parse }, runtime: "https://host.test/runtime.js" });

    expect(code).toContain("from 'https://host.test/runtime.js'");
    expect(code).not.toContain("from 'canvasengine'");
  });

  test("returns what the component uses of the runtime, to import it", () => {
    const { metadata } = compileCe(SAMPLES.simple, "/app/a.ce", { parser: { parse } });

    expect(metadata.primitiveComponents).toEqual(expect.arrayContaining(["Container", "Text", "Rect"]));
    expect(metadata.runtimeHelpers).toEqual(expect.arrayContaining(["h", "computed"]));
  });

  test("refuses a scoped style when it is not given what scopes it", () => {
    expect(() => compileCe(SAMPLES.scoped, "/app/s.ce", { parser: { parse } })).toThrow(/scopeStyles/);
  });

  test("tells where a template is wrong", () => {
    expect(() => compileCe(`<Container><Text text="x"</Container>`, "/app/bad.ce", { parser: { parse } })).toThrow(/CE_TEMPLATE_UNCLOSED_TAG[\s\S]*line 1/);
  });
});

describe("compile: the entry that needs nothing of Node", () => {
  test("gives the output of the plugin when it is given the same transpile", () => {
    const real = (canvasengine() as any).transform(SAMPLES.control, "/app/control.ce");

    expect(compile(SAMPLES.control, "/app/control.ce", { transpile: typescript }).code).toBe(real.code);
  });

  test("keeps the script as it was written when it has no types to strip", () => {
    const { code } = compile(SAMPLES.control, "/app/control.ce");

    expect(code).toContain("const open = signal(true)\n");
    expect(code).toContain("loop(");
  });

  test("names the component when no id is given", () => {
    expect(compile(SAMPLES.simple).code).toContain("export default __ce_component");
  });

  test("compiles without generating code from text: a Worker does not allow it", () => {
    const realEval = globalThis.eval;
    const RealFunction = globalThis.Function;
    const forbidden = () => { throw new Error("code is generated from text"); };
    globalThis.eval = forbidden as typeof eval;
    (globalThis as { Function: unknown }).Function = new Proxy(RealFunction, { construct: forbidden, apply: forbidden });
    try {
      expect(compile(SAMPLES.control, "/app/control.ce").code).toContain("function component");
    } finally {
      globalThis.eval = realEval;
      globalThis.Function = RealFunction;
    }
  });

  test("scopes a style when it is given what does it, and says so when it is not", () => {
    expect(() => compile(SAMPLES.scoped, "/app/s.ce")).toThrow(/scopeStyles/);
    expect(compile(SAMPLES.scoped, "/app/s.ce", { scopeStyles }).code).toContain("ce-style-");
  });

  test("strips the types of a script when it is given what does it", () => {
    expect(compile(SAMPLES.typed, "/app/t.ce", { transpile: typescript }).code).toContain("signal('typed')");
  });

  test("reports a template that is wrong with its line, its column and a hint", () => {
    expect(() => compile(`<Container><Text text="x"</Container>`, "/app/bad.ce")).toThrow(/Unclosed tag <Container>[\s\S]*Hint/);
  });
});

describe("the pre-generated parser", () => {
  test("is the one of the grammar: it is generated again, so a grammar that changed shows here", () => {
    const generated = (pkg as any).generate(grammar, { output: "source", format: "es" }) as string;

    expect(fs.readFileSync("packages/compiler/src/template-parser.generated.js", "utf8")).toBe(generated);
  });
});
