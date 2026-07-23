# canvasengine

## 2.1.1

### Patch Changes

- 5f24899: Fix nested and reactive flex containers so their dimensions are applied through Yoga before layout, defer layout creation until mount, and keep absolute percentage graphics aligned after their visual bounds are drawn.
- 61e4aec: Centralize Yoga layout prop normalization, make Canvas a complete responsive flex root, support reactive layout activation and deactivation plus display changes, automatically create parent containing boxes for relative child constraints, keep text at its authored scale by default, upgrade `@pixi/layout`, align the workspace on PixiJS 8.19, and add deterministic visual layout regression coverage.
