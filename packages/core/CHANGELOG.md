# canvasengine

## 2.4.0

### Minor Changes

- ceb140c: - compiler: auto-import `computed`, `cond`, `loop` and `h` when only the script uses them (#63), skip regex literals when looking for `</script>` (#64), and export the types reachable from the public API (#65).
  - core: support the `eventMode` prop on display objects (#56), load Yoga in `bootstrapCanvas` before components use layout (#57), stop `CanvasSprite` initialization after destruction (#60), and apply `defineProps` type checks and defaults to signal props whose value is `undefined` (#66).
  - presets: stop weather layers subscribing to the tick after destruction (#58).

## 2.1.1

### Patch Changes

- 5f24899: Fix nested and reactive flex containers so their dimensions are applied through Yoga before layout, defer layout creation until mount, and keep absolute percentage graphics aligned after their visual bounds are drawn.
- 61e4aec: Centralize Yoga layout prop normalization, make Canvas a complete responsive flex root, support reactive layout activation and deactivation plus display changes, automatically create parent containing boxes for relative child constraints, keep text at its authored scale by default, upgrade `@pixi/layout`, align the workspace on PixiJS 8.19, and add deterministic visual layout regression coverage.
