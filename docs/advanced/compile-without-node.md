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

## Regenerating the parser

The parser comes from `grammar2.pegjs`. After editing the grammar:

```bash
pnpm --filter @canvasengine/compiler generate:parser
```

A test fails when `src/template-parser.generated.js` is not what the grammar produces.
