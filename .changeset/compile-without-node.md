---
"@canvasengine/compiler": minor
---

Add `@canvasengine/compiler/browser`: a pure `compile(source)` with a pre-generated template parser, usable in a browser or a Cloudflare Worker (no `fs`, no Vite, no `eval`). The Vite plugin now calls the same `compileCe` function.
