---
"canvasengine": patch
---

Re-apply the updates received during a `freeze` by children rendered by `@for` / `loop()`, `@if` / `cond()` and dynamic components once the element is unfrozen (#81).
