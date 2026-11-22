# Sprite3D

`Sprite3D` is a flat image in the 3D scene that turns to face the camera: 2D characters in a 3D world, trees, glows, markers. Its size comes from the image.

## Basic Usage

```html
<View3D>
  <Sprite3D
    image="./characters/hero.png"
    frame={{ x: 0, y: 0, width: 96, height: 96 }}
    position={[0, 0, 3]}
    anchor={{ x: 0.5, y: 1 }}
    billboardMode="cylindrical"
    alphaMode="mask"
    pixelSize={0.02}
  />
</View3D>

<script>
  import { View3D, Sprite3D } from "@canvasengine/3d";
</script>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `image` | `string` | Image URL |
| `texture` | `Texture` | A texture, used instead of `image` |
| `frame` | `{ x, y, width, height }` | Part of the image to show, in pixels: one cell of a sprite sheet |
| `flipX` | `boolean` | Mirrors the image left to right |
| `pixelSize` | `number` | World units per image pixel. Default `0.01`: a 512 px image is 5.12 units wide |
| `width` / `height` | `number` | Size in world units; overrides `pixelSize` |
| `anchor` | `number` \| `{ x, y }` | Point of the image placed on `position`. Default the centre |
| `billboardMode` | `"spherical"` \| `"cylindrical"` \| `"none"` | How it faces the camera (see below). Default `"spherical"` |
| `alphaMode` | `"blend"` \| `"mask"` \| `"opaque"` | `"blend"` (default) for soft edges; `"mask"` for hard cut-outs such as pixel art and leaves |
| `alphaCutoff` | `number` | With `"mask"`: alpha below this is cut away |
| `tint` | `number` | Multiplies the image colour |
| `alpha` | `number` | Opacity |
| `castShadow` / `receiveShadow` | `boolean` | Shadows |
| `sheet` | object | Sprite-sheet animation, same format as the 2D `Sprite` (see below) |

Plus the [common props](./getting-started#common-props).

## Facing the Camera

| `billboardMode` | Behaviour | Use for |
|-----------------|-----------|---------|
| `"spherical"` | Flat to the screen from every angle; ignores `rotation` | Glows, sparks, icons |
| `"cylindrical"` | Turns around its vertical axis only, so it stays upright | Characters, trees, signs |
| `"none"` | A fixed card, turned by `rotation` | Decals, posters |

For a character standing on the ground, use `"cylindrical"` with `anchor={{ x: 0.5, y: 1 }}`: the bottom middle of the image sits on `position`.

::: tip
Keep `"spherical"` sprites anchored at the centre: an anchor away from the centre makes them drift as the camera moves.
:::

## Sprite Sheets and Animation

`sheet` plays an animation from a sprite sheet, with **the same format as the 2D [Sprite](/components/sprite)**: a definition that cuts the image into cells, the animation to play, and parameters.

```html
<Sprite3D
  sheet={{ definition: heroSheet, playing: "walk", params: { direction } }}
  position={heroPos}
  anchor={{ x: 0.5, y: 1 }}
  billboardMode="cylindrical"
  alphaMode="mask"
  pixelSize={0.02}
/>

<script>
  import { signal } from "canvasengine";

  // 3 columns x 4 rows of cells, one row per direction
  const ROW = { down: 0, left: 1, right: 2, up: 3 };
  const heroSheet = {
    image: "./characters/hero.png",
    framesWidth: 3,
    framesHeight: 4,
    textures: {
      walk: {
        animations: ({ direction }) => {
          const frameY = ROW[direction ?? "down"];
          return [[
            { time: 0, frameX: 0, frameY },
            { time: 8, frameX: 1, frameY },
            { time: 16, frameX: 2, frameY },
            { time: 24, frameX: 1, frameY },
          ]];
        },
      },
    },
  };
  const direction = signal("down");
</script>
```

| `sheet` field | Description |
|---------------|-------------|
| `definition` | The sheet: `image`, `framesWidth`, `framesHeight` (or `rectWidth`, `rectHeight`, `offset`), and `textures`, one entry per animation. An animation can override any of these |
| `playing` | Name of the animation to play |
| `params` | Passed to `animations` when it is a function; a change restarts the animation |
| `onFinish` | Called each time the animation reaches its end |

`time` counts 1/60 s ticks from the start of the animation, as in 2D, and the animation loops after its last key frame. A key frame can also set `opacity` and `anchor`. A 3D sprite shows one layer: the first array of `animations`.

The same definition object works for a 2D `Sprite` and a `Sprite3D`.

### Animating by Hand

Without a sheet, drive `frame` with a signal; frames of one image share its texture, so changing frames stays fast:

```html
<Sprite3D image="./characters/hero.png" frame={heroFrame} billboardMode="cylindrical" alphaMode="mask" />

<script>
  import { signal } from "canvasengine";
  const heroFrame = signal({ x: 0, y: 0, width: 96, height: 96 });
</script>
```

::: warning
A sprite that faces the camera ignores a negative `scale.x`. To flip it, use `flipX={true}`. Pack sprite sheets without trimming: trimmed frames don't draw correctly.
:::
