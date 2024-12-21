# Use NineSliceSprite component

```html
<NineSliceSprite
  image="button.png"
  width={200}
  height={100}
  leftWidth={10}
  rightWidth={10}
  topHeight={10}
  bottomHeight={10}
  roundPixels={true}
/>
```

## Properties

You can use all properties from Display Object plus the following:

| Property | Type | Description |
|----------|------|-------------|
| `image` | string | Path to the image file to be used as texture |
| `texture` | Texture | Direct texture object to use instead of image path |
| `width` | number | Total width of the nine-slice sprite |
| `height` | number | Total height of the nine-slice sprite |
| `leftWidth` | number | Width of the left edge that should not be scaled |
| `rightWidth` | number | Width of the right edge that should not be scaled |
| `topHeight` | number | Height of the top edge that should not be scaled |
| `bottomHeight` | number | Height of the bottom edge that should not be scaled |
| `roundPixels` | boolean | If true, the sprite's position will be rounded to integers |

<!-- @include: ./_display-object.md -->
