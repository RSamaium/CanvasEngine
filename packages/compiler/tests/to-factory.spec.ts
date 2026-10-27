import { describe, expect, it } from "vitest";
import { toFactory } from "../src/to-factory";
import { compile } from "../browser";

/** Runs a factory the way a host would: the text is turned into a function (tests only; a Worker never does this). */
const run = (code: string, host: Record<string, unknown>) =>
  (new Function(`return (${code.replace(/^export default /, "")})`)() as (host: unknown) => Record<string, unknown>)(host);

const external = { canvasengine: "host.canvasengine", "@rpgjs/client": "host.rpgjs" };

describe("toFactory", () => {
  it("turns a module into a function of the host that returns what the module exports", () => {
    const code = toFactory(`export const a = 1; export function b() { return a + 1 } export default 'main'`, { external });

    expect(run(code, {})).toMatchObject({ a: 1, default: "main" });
    expect((run(code, {}).b as () => number)()).toBe(2);
  });

  it("exports a list and a renamed name, and a default class or function", () => {
    const list = run(toFactory(`const x = 1, y = 2; export { x, y as z }`, { external }), {});
    const fn = run(toFactory(`export default function hello() { return 'hi' }`, { external }), {});
    const klass = run(toFactory(`export default class Box { size() { return 3 } }`, { external }), {});

    expect(list).toEqual({ x: 1, z: 2 });
    expect((fn.default as () => string)()).toBe('hi');
    expect(new (klass.default as new () => { size(): number })().size()).toBe(3);
  });

  it("gets the imports of a known module from the host: named, renamed, namespace and default", () => {
    const code = toFactory(`import { h, signal as s } from 'canvasengine'; import * as ce from 'canvasengine'; import def from 'canvasengine'; export default [h(), s(), ce.h(), def]`, { external });

    const host = { canvasengine: { h: () => 'h', signal: () => 's', default: 'd' } };
    expect(run(code, host).default).toEqual(['h', 's', 'h', 'd']);
  });

  it("gets a file of the same plugin with host.require, given the path it resolves to", () => {
    const code = toFactory(`import Badge from './badge.ce'; import { format } from './helpers.js'; import * as all from './helpers.js'; export default [Badge, format(2), typeof all.format]`, {
      external,
      resolve: (specifier) => specifier.replace("./", ""),
    });

    const files: Record<string, Record<string, unknown>> = { "badge.ce": { default: "BADGE" }, "helpers.js": { format: (n: number) => `n${n}` } };
    const host = { require: (path: string) => files[path] };
    expect(run(code, host).default).toEqual(["BADGE", "n2", "function"]);
  });

  it("refuses an import that is neither known nor a file of the plugin, and says which", () => {
    expect(() => toFactory(`import x from 'lodash'`, { external })).toThrow(/lodash/);
    expect(() => toFactory(`import x from './missing.js'`, { external, resolve: () => undefined })).toThrow(/missing\.js/);
  });

  it("refuses what it cannot turn: re-exports", () => {
    expect(() => toFactory(`export * from 'canvasengine'`, { external })).toThrow(/export/);
    expect(() => toFactory(`export { a } from './a.js'`, { external, resolve: (s) => s })).toThrow(/export/);
  });

  it("makes a compiled component a factory whose default export is the component", () => {
    const { code } = compile(`<Container><Text text="Hi" /></Container>`, "panel.ce");
    const factory = toFactory(code, { external });
    const calls: unknown[][] = [];
    const runtime = new Proxy({ h: (...args: unknown[]) => { calls.push(args); return { tag: args[0] }; }, useProps: () => ({}), useDefineProps: () => () => ({}), useDefineEmits: () => () => undefined, computed: (fn: unknown) => fn }, { get: (t, k) => (k in t ? (t as any)[k] : k) });

    const component = run(factory, { canvasengine: runtime }).default as (props: unknown) => unknown;

    expect(component({})).toEqual({ tag: "Container" });
  });
});
