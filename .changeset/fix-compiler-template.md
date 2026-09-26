---
"@canvasengine/compiler": patch
---

- PascalCase tags named like HTML elements, such as `<Video>`, `<Header>` or `<Map>`, are now compiled as components. Lowercase tags, and uppercase ones such as `<DIV>`, are still HTML elements.
- Inline `<svg>` content is escaped, so backticks and `${` in the markup no longer break the generated code.
