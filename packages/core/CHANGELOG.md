# canvasengine

## 2.4.0

All CanvasEngine packages are released together as 2.4.0.

### Minor Changes

- Support the `eventMode` prop on display objects. An explicit value such as `eventMode="none"` wins over the `"static"` mode set by event props, so a visual-only overlay no longer intercepts pointer events (#56).

### Patch Changes

- Load Yoga in `bootstrapCanvas` before components use layout (#57).
- Stop `CanvasSprite` initialization after the sprite is destroyed while its spritesheet is loading (#60).
- Apply `defineProps` type checks and defaults to signal props whose value is `undefined` (#66).
- presets: stop weather layers subscribing to the tick after destruction (#58).
- compiler: auto-import `computed`, `cond`, `loop` and `h` when only the script uses them (#63), skip regex literals when looking for `</script>` (#64), and export the types reachable from the public API (#65).
- compiler: PascalCase tags named like HTML elements, such as `<Video>`, `<Header>` or `<Map>`, are now compiled as components. Lowercase tags, and uppercase ones such as `<DIV>`, are still HTML elements.
- compiler: inline `<svg>` content is escaped, so backticks and `${` in the markup no longer break the generated code.
- compiler: the template grammar now returns a tree, and a separate code generator produces the template code. The generated code is unchanged.

## 2.1.1

### Patch Changes

- 5f24899: Fix nested and reactive flex containers so their dimensions are applied through Yoga before layout, defer layout creation until mount, and keep absolute percentage graphics aligned after their visual bounds are drawn.
- 61e4aec: Centralize Yoga layout prop normalization, make Canvas a complete responsive flex root, support reactive layout activation and deactivation plus display changes, automatically create parent containing boxes for relative child constraints, keep text at its authored scale by default, upgrade `@pixi/layout`, align the workspace on PixiJS 8.19, and add deterministic visual layout regression coverage.
