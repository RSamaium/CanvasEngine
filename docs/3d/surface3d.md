# Surface3D

`Surface3D` shows 2D CanvasEngine components on a plane in the 3D scene: a score board, an in-game screen, a sign, a health bar over a character. Its children are ordinary 2D components (`Text`, `Rect`, `Sprite`, `Container`...).

## Basic Usage

```html
<View3D>
  <Surface3D position={[4.5, 3, -2]} rotation={[0, -0.5, 0]} width={4} resolution={[512, 256]} clearColor={0x1b1430}>
    <Rect x={12} y={12} width={488} height={232} color="#2c2150" />
    <Text text="Score" x={256} y={70} anchor={0.5} size={44} color="#ffc46b" />
    <Text text={score} x={256} y={160} anchor={0.5} size={36} color="#ffffff" />
  </Surface3D>
</View3D>

<script>
  import { signal } from "canvasengine";
  import { View3D, Surface3D } from "@canvasengine/3d";

  const score = signal(0);
</script>
```

The 2D children are laid out in a `resolution`-sized area, from (0, 0) at the top left, like a small canvas. The plane is `width` units wide, and its height follows the area's shape: here 4 × 256 / 512 = 2 units.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `resolution` | `[width, height]` | Size of the 2D area in pixels. Default `[512, 256]` |
| `width` | `number` | Width of the plane in world units. Default `2` |
| `clearColor` | `number` | Colour behind the 2D content. Without it, empty areas are transparent |
| `lit` | `boolean` | `false` (default): shows as lit from within, like a screen. `true`: lit by the scene, like a poster |
| `update` | `"frame"` \| `"manual"` | `"frame"` (default) redraws the 2D every frame. `"manual"`: only when you call `redraw()` |
| `doubleSided` | `boolean` | Draws the back face too |

Plus the [common props](./getting-started#common-props). The plane faces +Z: turn it with `rotation`.

## Clicks

The 2D children are not on the stage, so they don't receive pointer events. Put the handler on the `Surface3D` itself:

```html
<Surface3D click={() => score.update((n) => n + 1)}>...</Surface3D>
```

To know where the click landed, set `hitVolume="geometry"`: the event's `hit3D.uv` holds the position on the surface, from 0 to 1 (`uv.x * width`, `(1 - uv.y) * height` in the 2D area).

## Performance

With `update="frame"`, the 2D is drawn again every frame. For content that changes rarely (a score, a name), use `update="manual"` and call the instance's `redraw()` after each change. In a component whose root is the `Surface3D`, `mount` gives that instance:

```html
<!-- ScoreBoard.ce -->
<Surface3D update="manual" width={3} resolution={[512, 128]} clearColor={0x1b1430}>
  <Text text={score} x={256} y={64} anchor={0.5} size={64} color="#ffc46b" />
</Surface3D>

<script>
  import { mount, effect } from "canvasengine";
  import { Surface3D } from "@canvasengine/3d";

  const { score } = defineProps();

  mount((element) => {
    const surface = element.componentInstance;
    effect(() => {
      score(); // runs again when the score changes
      surface.redraw();
    });
  });
</script>
```

::: tip
For a label that always faces the screen and is never hidden by walls, use [Label3D](./label3d) instead: it is a plain 2D overlay, cheaper and sharper.
:::
