# Use TilingSprite component

The TilingSprite component allows you to create a repeating sprite pattern that can be scaled and positioned.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `image` | `string` | Path to the image that will be used as the tiling texture |
| `tileScale` | `{ x: number; y: number }` | Scale of the tiling pattern on both axes |
| `tilePosition` | `{ x: number; y: number }` | Position offset of the tiling pattern |
| `width` | `number` | Width of the tiling sprite container |
| `height` | `number` | Height of the tiling sprite container |

## Examples

Basic usage:
```html
<TilingSprite image="path/to/image.png" />
```

With custom size:
```html
<TilingSprite 
  image="path/to/image.png"
  width={500}
  height={300}
/>
```

With scale and position:
```html
<TilingSprite 
  image="path/to/image.png"
  tileScale={{ x: 2, y: 2 }}
  tilePosition={{ x: 100, y: 50 }}
  width={800}
  height={600}
/>
```

<!-- @include: ./_display-object.md -->
