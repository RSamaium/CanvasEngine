---
"canvasengine": patch
---

Fix nested and reactive flex containers so their dimensions are applied through Yoga before layout, defer layout creation until mount, and keep absolute percentage graphics aligned after their visual bounds are drawn.
