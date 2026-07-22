# Graphics Component

<script setup>
import polygonExample from './examples/polygon-example.js'
</script>

Use `Graphics` when you need to draw custom vector shapes with PixiJS. For common primitive shapes, CanvasEngine also provides the `Rect`, `Circle`, `Triangle`, and `Ellipse` shortcuts.

## Minimal example

```html
<script>
const draw = (g) => {
  g.rect(0, 0, 100, 100).fill('red')
}
</script>

<Graphics draw />
```

## Reactive redraw

```html
<script>
import { signal } from 'canvasengine'

const width = signal(100)
const height = signal(100)

const draw = (g, width, height) => {
  g.rect(0, 0, width, height).fill('red')
}

const click = () => {
  width.update(w => w + 10)
  height.update(h => h + 10)
}
</script>

<Graphics draw click width height />
```

The drawing is redrawn when `width` or `height` changes.

## Absolute layout backgrounds

Graphics update their layout bounds after drawing. This makes percentage-based primitives suitable for backgrounds inside positioned flex containers:

```html
<Container width={420} height={210} display="flex" justifyContent="center" alignItems="center">
  <Rect
    positionType="absolute"
    top={0}
    right={0}
    bottom={0}
    left={0}
    width="100%"
    height="100%"
    color="#1e293b"
  />
  <Text text="Centered content" color="white" />
</Container>
```

## Polygon Example

<Playground v-bind="polygonExample" />

## Shape shortcuts

Use these components when a primitive shape is enough and a custom `draw` function would add noise.

### Rectangle

```html
<Rect x={0} y={0} width={100} height={100} color="red" />
```

### Circle

```html
<Circle x={0} y={0} radius={50} color="red" />
```

### Triangle

```html
<Triangle x={0} y={0} width={100} height={100} color="red" />
```

### Ellipse

```html
<Ellipse x={0} y={0} width={100} height={100} color="red" />
```

## draw

Function that draws on the canvas. It receives the `Graphics` object as argument. It uses [PixiJS Graphics](https://pixijs.download/release/docs/scene.Graphics.html) to draw.

<!-- @include: ./_display-object.md -->
