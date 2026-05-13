## Common Properties

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| x              | number              | X-coordinate position of the display object.                                |
| y              | number              | Y-coordinate position of the display object.                                |
| width          | number              | Width of the display object.                                                |
| height         | number              | Height of the display object.                                               |
| scale          | object              | Scale of the display object.                                                |
| anchor         | object              | Anchor point of the display object.                                         |
| skew           | object              | Skew of the display object.                                                 |
| tint           | number              | Tint color of the display object.                                           |
| rotation       | number              | Rotation of the display object in radians.                                  |
| angle          | number              | Rotation of the display object in degrees.                                  |
| zIndex         | number              | Z-index of the display object.                                              |
| roundPixels    | boolean             | Whether to round pixel values.                                              |
| cursor         | string              | Cursor style when hovering over the display object.                         |
| visible        | boolean             | Visibility of the display object.                                           |
| alpha          | number              | Alpha transparency of the display object.                                   |
| pivot          | object              | Pivot point of the display object.                                          |
| filters        | array               | Filters applied to the display object.                                      |
| maskOf         | Element             | Element that this display object masks.                                     |
| blendMode      | string              | Blend mode for rendering.                                                   |
| filterArea     | object              | Filter area for rendering.                                                  |
| outline        | object              | Outline effect following the object's alpha contour.                        |
| clip           | object              | Rectangular mask used to keep or hide part of the object.                   |
| occlusion      | object              | Low-alpha redraw of the covered part when this object passes behind obstacles. |

## Layout Properties

Pour obtenir la documentation complète et détaillée sur toutes les propriétés de mise en page, consultez la documentation officielle de [PixiJS Layout](https://layout.pixijs.io/).

### Sizing and Dimensions

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| width          | number/string       | Width of the display object. Accepts pixels or percentage (e.g. '50%').     |
| height         | number/string       | Height of the display object. Accepts pixels or percentage (e.g. '50%').    |
| minWidth       | number/string       | Minimum width the object can shrink to.                                     |
| minHeight      | number/string       | Minimum height the object can shrink to.                                    |
| maxWidth       | number/string       | Maximum width the object can expand to.                                     |
| maxHeight      | number/string       | Maximum height the object can expand to.                                    |
| aspectRatio    | number              | Ratio between width and height (e.g. 1.5 for 3:2 ratio).                    |

### Flex Layout

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| flexDirection  | string              | Direction of flex items. Values: 'row', 'column', 'row-reverse', 'column-reverse'. |
| flexWrap       | string              | Whether items wrap. Values: 'wrap', 'nowrap', 'wrap-reverse'.               |
| justifyContent | string              | Alignment along main axis. Values: 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'. |
| alignItems     | string              | Alignment along cross axis. Values: 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'. |
| alignContent   | string              | Alignment of lines with multiple items. Values: 'flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'. |
| alignSelf      | string              | Override of parent's alignItems for specific item.                          |
| flexGrow       | number              | Grow factor of item relative to other items.                                |
| flexShrink     | number              | Shrink factor of item relative to other items.                              |
| flexBasis      | number/string       | Initial size of item before flex growing/shrinking.                         |
| gap            | number/object       | Gap between items.                                                          |
| rowGap         | number              | Gap between rows.                                                           |
| columnGap      | number              | Gap between columns.                                                        |

### Positioning

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| positionType   | string              | Type of positioning. Values: 'relative', 'absolute', 'static'.              |
| top            | number/string       | Distance from the top edge.                                                 |
| right          | number/string       | Distance from the right edge.                                               |
| bottom         | number/string       | Distance from the bottom edge.                                              |
| left           | number/string       | Distance from the left edge.                                                |

### Spacing, Margins and Borders

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| margin         | number/array        | Space outside border box. Can be single value or array for different sides. |
| padding        | number/array        | Space inside border box. Can be single value or array for different sides.  |
| border         | number/array        | Border width. Can be single value or array for different sides.             |

### Object Fitting and Alignment

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| objectFit      | string              | How object is resized to fit layout box. Values: 'contain', 'cover', 'fill', 'none', 'scale-down'. |
| objectPosition | string              | Anchor point of object inside layout box. E.g. 'center', 'top left'.        |
| transformOrigin| string              | Pivot point for rotation and scaling of layout box.                         |

## Shadow 

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| blur           | number              | Blur strength.                                                              |
| color          | number              | Color of the shadow.                                                        |
| offset         | object              | Offset of the shadow.                                                       |
| quality        | number              | Quality of the shadow.                                                      |


# Hook before destroy


```html
<script>
  import {
    signal,
    animatedSignal,
    effect,
    animatedSequence,
  } from "canvasengine";
  import MyViewport from "./viewport.ce";
  
  let bool = signal(true)
  const opacity = animatedSignal(1, { duration: 500 });

  const click = async () => {
    bool.set(!bool())
  }

  const beforeDestroy = async () => {
    await animatedSequence([
      () => opacity.set(0),
    ])
    console.log("before destroy")
  }
</script>


<Canvas antialias={true}>
     <Container onBeforeDestroy={beforeDestroy}>
        @if (bool) {
            <Rect width={300} height={300} color="red" alpha={opacity} click />
        }
    </Container>
</Canvas>
```
