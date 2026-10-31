# Compile `.ce` without Node

`@canvasengine/compiler/browser` exposes the compiler as a pure function: `.ce` source in, JavaScript out. It needs no `fs`, no Vite and no native module, so it runs in a browser, in a Web Worker and in a Cloudflare Worker (workerd forbids `eval` and `new Function`; the compiler uses neither, its template parser is pre-generated).

```ts
import { compile } from '@canvasengine/compiler/browser'

const { code, metadata } = compile(source, 'panel.ce')
// code: an ES module (default export: the component)
// metadata.runtimeHelpers, metadata.primitiveComponents
```

`compile(source, id?, options?)` throws an `Error` with the code, line and column of the problem (`[CE_TEMPLATE_UNCLOSED_TAG] … (line 1, column 2)`).

## Options

| Option | Default | Role |
| --- | --- | --- |
| `runtime` | `canvasengine` | Module the runtime is imported from in the output. |
| `transpile` | none | `(code) => code` that strips the types of `<script lang="ts">`. Without it the script must be plain JavaScript. |
| `scopeStyles` | none | `(css, scopeClass, id) => css` for `<style scoped>`. Without it a scoped style throws an error that names this option (the Vite plugin uses `lightningcss`, which is native). |
| `hot` | `false` | Adds the HMR code of Vite. |

The Vite plugin calls the same function (`compileCe`), so the output is the same in both.

## Load a module from text: `toFactory`

A host that builds modules from text (no bundler, no `import()` of a path) can turn an ES module, a compiled component included,
into a function of the host:

```ts
import { compile, toFactory } from '@canvasengine/compiler/browser'

const { code } = compile(source, 'panel.ce')
const factory = toFactory(code, {
  external: { canvasengine: 'host.canvasengine' },   // modules the host provides
  resolve: (specifier) => files.has(specifier.replace('./', '')) ? specifier.replace('./', '') : undefined, // files of the same package
})
// factory: "export default (host) => { …; return { default: component } }"
```

- The imports of an `external` module become constants taken from the host (`import { h } from 'canvasengine'` →
  `const h = host.canvasengine.h`). An import of a file of the package is read with `host.require(key)`, which must give the
  exports object of that file. Any other import throws an error that names it.
- The exports become the returned object, `default` included. `export * from` and `export { a } from` are refused.
- The host builds the function from the text (a `blob:` URL in a browser) and calls it with `{ canvasengine, require }`.

## Regenerating the parser

The parser comes from `grammar2.pegjs`. After editing the grammar:

```bash
pnpm --filter @canvasengine/compiler generate:parser
```

A test fails when `src/template-parser.generated.js` is not what the grammar produces.
