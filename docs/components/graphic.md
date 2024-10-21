# Use Graphics component

Common example:

```html
<script>
const draw = (g) => {
    g.rect(0, 0, 100, 100).fill('red')
}
</script>

<Graphics @draw />
```

Example with width and height:

```html
<script>
import { signal } from 'canvasengine'

const width = signal(100)
const height = signal(100)

const draw = (g) => {
    g.rect(0, 0, width(), height()).fill('red')
}

const click = () => {
    width.update(w => w + 10)
    height.update(h => h + 10)
}
</script>

<Graphics @draw @click />
```

## Rect

```html
<Rect x="0" y="0" width="100" height="100" color="red" />
```

## Circle

```html
<Circle x="0" y="0" radius="50" color="red" />
```

## Properties

You can use all properties from Display Object

### draw

Function that draws on the canvas. It receives the `Graphics` object as argument. It uses [PixiJS Graphics](https://pixijs.download/release/docs/scene.Graphics.html) to draw.
