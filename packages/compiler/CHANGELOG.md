# @canvasengine/compiler

## 2.5.0

### Minor Changes

- 305d728: Add `@canvasengine/compiler/browser`: a pure `compile(source)` with a pre-generated template parser, usable in a browser or a Cloudflare Worker (no `fs`, no Vite, no `eval`). The Vite plugin now calls the same `compileCe` function. `toFactory` turns a module, a compiled component included, into a function of its host, so a host can load modules from text and give them what they import.
