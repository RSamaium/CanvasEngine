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

When using a hitbox, the sprite's anchor can be automatically calculated from the hitbox bounds, `rectHeight`, and `spriteRealSize` so the visual sprite aligns with the desired reference point inside the collision box. This is particularly useful for character sprites where the visual representation is larger than the actual collision area.

By default, `hitbox.anchorMode` is `"top-left"`, which preserves the legacy behavior: the sprite is positioned so the top-left of the hitbox area inside the frame matches the sprite position.

### Hitbox Anchor Modes

```html
<Sprite
    image="path/to/character.png"
    hitbox={{ w: 32, h: 48, anchorMode: "top-left" }}
/>
```

`"top-left"`:
- Default mode.
- Aligns the sprite so the top-left corner of the hitbox matches the sprite position.
- Useful when your `x`/`y` coordinates already represent the top-left of a collision box.

```html
<Sprite
    image="path/to/character.png"
    hitbox={{ w: 32, h: 48, anchorMode: "center" }}
/>
```

`"center"`:
- Uses the center of the hitbox as the sprite anchor.
- Useful when your entity position should represent the center of its collision area.

```html
<Sprite
    image="path/to/character.png"
    hitbox={{ w: 32, h: 48, anchorMode: "foot" }}
/>
```

`"foot"`:
- Uses the bottom-center of the visible sprite area as the anchor.
- Useful for character-based games where `x`/`y` should represent the feet or ground contact point.

::: tip
When `spriteRealSize` is provided on a spritesheet definition, CanvasEngine uses it to remove transparent margins from the hitbox anchor calculation. Without `spriteRealSize`, the full frame size is used.
:::

## Sprite Effects

### Outline on hover

```html
<script>
const hovered = signal(false)
</script>

<Sprite
    image="path/to/character.png"
    mouseenter={() => hovered.set(true)}
    mouseleave={() => hovered.set(false)}
    outline={{
        enabled: hovered,
        color: 0xffcc33,
        thickness: 3,
        quality: 0.2
    }}
/>
```

`outline` uses the sprite alpha channel, so the border follows the visible contour instead of the rectangular texture bounds.

### Hide part of a sprite

```html
<Sprite
    image="path/to/character.png"
    clip={{
        mode: "hide",
        shape: { type: "rect", x: 0, y: 42, width: 64, height: 22 }
    }}
/>
```

`mode: "hide"` makes the shape transparent. This is useful for a character walking through tall grass.

### Keep only part of a sprite

```html
<Sprite
    image="path/to/carrot.png"
    clip={{
        mode: "keep",
        shape: { type: "rect", x: 0, y: 0, width: 32, height: 18 }
    }}
/>
```

`mode: "keep"` renders only the shape. This is useful for an object partly buried in the ground.

### Hide a sprite behind another sprite

```html
<script>
let hero
let grass
</script>

<Sprite ref={grass} image="path/to/grass.png" />
<Sprite
    ref={hero}
    image="path/to/hero.png"
    occlusion={{
        obstacles: grass,
        bounds: "hitbox",
        alpha: 0.35,
        padding: 2
    }}
/>
```

`occlusion` keeps the current sprite behind the obstacle, then redraws only the covered part above the obstacle with low opacity. By default it uses object bounds; `bounds: "hitbox"` uses the sprite hitbox when one is available.

## DOMSprite: objectFit, width/height, class, style

When a `Sprite` is rendered inside a `DOMContainer`, it is routed to `DOMSprite`. You can use DOM-specific props to control sizing and containment.

### Contain a frame inside a fixed box

Use `objectFit="contain"` with `width`/`height` to scale the frame to fit the box while preserving its aspect ratio.

```html
<DOMContainer>
  <Sprite
    objectFit="contain"
    width={100}
    height={100}
    sheet={{
      definition,
      playing: "default"
    }}
  />
</DOMContainer>
```

### class and style

You can pass `class` and `style` directly on `Sprite`/`DOMSprite` when used inside a `DOMContainer`.

```html
<DOMContainer>
  <Sprite
    class="avatar"
    style={{ border: "1px solid red" }}
    image="./hero.png"
  />
</DOMContainer>
```

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
| `spriteRealSize` | number \| `{ width: number, height: number }` | (Optional) Real size of sprite for collision detection and hitbox anchor calculations |
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
| `hitbox` | `{ w: number, h: number, anchorMode?: "top-left" \| "center" \| "foot" }` | (Optional) Collision box dimensions and alignment mode. Automatically calculates anchor positioning based on the hitbox, `rectHeight`, and `spriteRealSize` |

::: tip
The `loader` prop on individual sprites tracks that specific sprite's loading progress, while `context.globalLoader` tracks all sprites in the component tree. Use the global loader for overall progress, and individual loaders for sprite-specific handling.
:::

<!-- @include: ./_display-object.md -->
