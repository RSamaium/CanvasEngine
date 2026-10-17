---
"canvasengine": patch
---

Fix: `KeyboardControls` now removes the `keydown` / `keyup` listeners it added on `document` when it is destroyed. They were never removed, so every destroyed `controls` kept listening to the keyboard and could not be garbage collected (#75).
