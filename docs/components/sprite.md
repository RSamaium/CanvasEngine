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

### With explicit dimensions:

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

### With auto-detected dimensions:

The `width` and `height` parameters are optional. If not provided, they will be automatically detected from the image dimensions when the sprite is loaded.

```html
<script>
const definition = {
    id: "explosion",
    image: "./exp.png",
    framesWidth: 4,
    framesHeight: 4,
    textures: {
        default: {
             animations: () => [
                [ 
                    { time: 0, frameX: 0, frameY: 0 },
                    { time: 10, frameX: 1, frameY: 0 },
                    { time: 20, frameX: 2, frameY: 0 },
                    { time: 30, frameX: 3, frameY: 0 }
                ]
             ]
        }
    }
}
</script>

<Sprite 
    sheet={{
        definition,
        playing: "default"
    }}
/>
```

## Sprite with Hitbox:

```html
<Sprite 
    image="path/to/character.png"
    hitbox={{ w: 32, h: 48 }}
/>
```

When using a hitbox, the sprite's anchor will be automatically calculated based on the `rectHeight` and `spriteRealSize` properties to properly align the sprite with its collision box. This is particularly useful for character sprites where the visual representation might be larger than the actual collision area.

## Available Sheet Definition Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique identifier for the spritesheet |
| `image` | string | Path to the spritesheet image |
| `width` | number | (Optional) Total width of the spritesheet image. If not provided, will be automatically detected from the image dimensions |
| `height` | number | (Optional) Total height of the spritesheet image. If not provided, will be automatically detected from the image dimensions |
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

## Global Asset Loader

When a component contains multiple sprites with images, you can track the loading progress of all assets using the global asset loader available in the component context. This is useful for displaying a loading screen or progress bar before all assets are ready.

### Basic Usage

The global loader is automatically available in the component context. Access it using the `mount` function:

```html
<Canvas>
  <Sprite image="hero.png" />
  <Sprite image="enemy.png" />
  <Sprite sheet={{ definition: spritesheetDef }} />
</Canvas>

<script>
import { mount } from 'canvasengine'

mount((element) => {
  const loader = element.props.context?.globalLoader
  
  if (loader) {
    // Track overall progress
    loader.onProgress((progress) => {
      console.log(`Loading: ${(progress * 100).toFixed(0)}%`)
      // Update your progress bar here
    })
    
    // Know when all assets are loaded
    loader.onComplete(() => {
      console.log('All assets loaded!')
      // Hide your loader here
    })
  }
})
</script>
```

### Progress Tracking

The global loader automatically tracks:
- Simple images loaded via the `image` prop
- Spritesheet images from `sheet.definition.image`
- All animation textures in spritesheets

The progress value ranges from 0 to 1, where:
- `0` = No assets loaded
- `1` = All assets loaded

### Example: Loading Screen

```html
<Canvas>
  <Sprite image="background.png" />
  <Sprite image="player.png" />
  <Sprite sheet={{ definition: enemySpritesheet }} />
</Canvas>

<script>
import { mount, signal } from 'canvasengine'

const isLoading = signal(true)
const loadingProgress = signal(0)

mount((element) => {
  const loader = element.props.context?.globalLoader
  
  if (loader) {
    loader.onProgress((progress) => {
      loadingProgress.set(progress)
    })
    
    loader.onComplete(() => {
      isLoading.set(false)
    })
  }
})
</script>
```

### API Reference

The global loader provides the following methods:

| Method | Description |
|--------|-------------|
| `onProgress(callback)` | Register a callback for progress updates. Returns an unsubscribe function. |
| `onComplete(callback)` | Register a callback when all assets are loaded. Returns an unsubscribe function. |
| `getGlobalProgress()` | Get the current global progress (0-1) |
| `getAssetCount()` | Get the number of assets being tracked |
| `getCompletedCount()` | Get the number of completed assets |

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
| `loader` | object | Loading configuration (per-sprite) |
| `loader.onProgress` | function | Progress callback for loading (per-sprite) |
| `loader.onComplete` | function | Completion callback for loading (per-sprite) |
| `scaleMode` | number | PIXI.js scale mode for the texture |
| `hitbox` | `{ w: number, h: number }` | (Optional) Collision box dimensions. Automatically calculates anchor positioning based on `rectHeight` and `spriteRealSize` to properly align the sprite with its hitbox |

::: tip
The `loader` prop on individual sprites tracks that specific sprite's loading progress, while `context.globalLoader` tracks all sprites in the component tree. Use the global loader for overall progress, and individual loaders for sprite-specific handling.
:::

<!-- @include: ./_display-object.md -->
