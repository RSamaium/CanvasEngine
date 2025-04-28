# Sprite Component

## Simple Image:

```html
<Sprite 
    image="path/to/image.png"
/>
```

## Part of an image:

```html
<Sprite 
    image="path/to/image.png"
    rectangle={{ x: 0, y: 0, width: 100, height: 100 }}
/>
```

## Sprite Sheet:

```html
<script>
const definition = {
    id: "hero",
    image: "./hero_2.png",
    width: 1248,
    height: 2016,
    framesWidth: 6,
    framesHeight: 4,
    textures: {
        stand: {
             animations: ({ direction }) => [
                [ { time: 0, frameX: 0, frameY: 0 } ]
             ]
        },
        walk: {
             animations: ({ direction }) => [
                [ 
                  { time: 0, frameX: 0, frameY: 1 },
                  { time: 10, frameX: 1, frameY: 1 },
                  { time: 20, frameX: 2, frameY: 1 }
                ]
             ]
        }
    }
}

const onFinish = () => {
    console.log("Animation finished")
}
</script>

<Sprite 
    sheet={{
        definition,
        playing: "stand",
        params: {
            direction: "right"
        },
        onFinish
    }}
/>
```

## Available Sheet Definition Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique identifier for the spritesheet |
| `image` | string | Path to the spritesheet image |
| `width` | number | Total width of the spritesheet image |
| `height` | number | Total height of the spritesheet image |
| `framesWidth` | number | Number of frames horizontally in the spritesheet |
| `framesHeight` | number | Number of frames vertically in the spritesheet |
| `rectWidth` | number | (Optional) Width of each frame if not equal to width/framesWidth |
| `rectHeight` | number | (Optional) Height of each frame if not equal to height/framesHeight |
| `offset` | `{ x: number, y: number }` | (Optional) Offset to start frame cutting from |
| `sound` | string | (Optional) Path to sound file that plays when animation starts |
| `spriteRealSize` | number \| `{ width: number, height: number }` | (Optional) Real size of sprite for collision detection |
| `anchor` | [number, number] | (Optional) Anchor point [x, y] for positioning (0-1) |
| `scale` | [number, number] | (Optional) Scale factor [x, y] |
| `skew` | [number, number] | (Optional) Skew value [x, y] |
| `pivot` | [number, number] | (Optional) Pivot point [x, y] for rotation |
| `opacity` | number | (Optional) Opacity value (0-1) |
| `textures` | object | Contains named animations and their frame definitions |

## Animation Frame Parameters

Each frame in an animation can have these properties:

| Parameter | Type | Description |
|-----------|------|-------------|
| `time` | number | Time (in frames) when this frame should be displayed |
| `frameX` | number | Horizontal frame index in the spritesheet |
| `frameY` | number | Vertical frame index in the spritesheet |
| `x` | number | (Optional) X position offset for this frame |
| `y` | number | (Optional) Y position offset for this frame |
| `angle` | number | (Optional) Rotation angle for this frame |
| `rotation` | number | (Optional) Alternative rotation value |
| `visible` | boolean | (Optional) Whether the frame is visible |
| `opacity` | number | (Optional) Frame-specific opacity (0-1) |
| `anchor` | [number, number] | (Optional) Frame-specific anchor point |
| `scale` | [number, number] | (Optional) Frame-specific scale |
| `skew` | [number, number] | (Optional) Frame-specific skew |
| `pivot` | [number, number] | (Optional) Frame-specific pivot point |
| `sound` | string | (Optional) Sound to play when this frame is reached |

## Sprite Props

| Prop | Type | Description |
|------|------|-------------|
| `image` | string | Path to the image (when not using a spritesheet) |
| `rectangle` | `{ x, y, width, height }` | (Optional) Extract only part of the image |
| `sheet` | object | Spritesheet configuration |
| `sheet.definition` | object | The spritesheet definition object |
| `sheet.playing` | string | Name of the animation to play |
| `sheet.params` | object | Parameters passed to the animation function |
| `sheet.onFinish` | function | Callback when animation completes |
| `loader` | object | Loading configuration |
| `loader.onProgress` | function | Progress callback for loading |
| `loader.onComplete` | function | Completion callback for loading |
| `scaleMode` | number | PIXI.js scale mode for the texture |

<!-- @include: ./_display-object.md -->
