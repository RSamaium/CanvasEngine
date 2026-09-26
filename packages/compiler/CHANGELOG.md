# @canvasengine/compiler

## 2.3.1

### Patch Changes

- 0278dc2: - PascalCase tags named like HTML elements, such as `<Video>`, `<Header>` or `<Map>`, are now compiled as components. Lowercase tags, and uppercase ones such as `<DIV>`, are still HTML elements.
  - Inline `<svg>` content is escaped, so backticks and `${` in the markup no longer break the generated code.
- ceb140c: - compiler: auto-import `computed`, `cond`, `loop` and `h` when only the script uses them (#63), skip regex literals when looking for `</script>` (#64), and export the types reachable from the public API (#65).
  - core: support the `eventMode` prop on display objects (#56), load Yoga in `bootstrapCanvas` before components use layout (#57), stop `CanvasSprite` initialization after destruction (#60), and apply `defineProps` type checks and defaults to signal props whose value is `undefined` (#66).
  - presets: stop weather layers subscribing to the tick after destruction (#58).
