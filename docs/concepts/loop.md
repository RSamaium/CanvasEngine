# Loop

To create a loop, you can use the `@for` directive.

```html
@for (sprite of sprites) {
    <Rect x={sprite.x} y={sprite.y} width={sprite.width} height={sprite.height} />
}

<script>
import { signal } from 'canvasengine'

const sprites = signal([{ x: 0, y: 0, width: 10, height: 10 }])
</script>
```