# Use Container component

Common example:

```html
<Container />
```

Example with x and y:

```html
<script>
import { signal } from 'canvasengine'

const x = signal(10)
const y = signal(10)

const click = () => {
    x.update(x => x + 10)
    y.update(y => y + 10)
}
</script>

<Container x y click />
```

## Native PixiJS children

Use `pixiChildren` when you need to mount PixiJS objects directly inside a
CanvasEngine container without wrapping every object in a CanvasEngine component.

```html
<script>
import { Container } from 'pixi.js'

const world = new Container()
</script>

<Container pixiChildren={[world]} />
```

CanvasEngine adds these objects to the PixiJS scene graph when the container is
mounted. It does not manage their internal state or lifecycle, so update and
destroy them manually when needed:

```html
<script>
import { Container as PixiContainer, Graphics } from 'pixi.js'

const world = new PixiContainer()
const brushPreview = new Graphics()

world.addChild(brushPreview)

function updatePreview(point) {
    brushPreview.clear()
    if (!point) return
    brushPreview
        .circle(point.x, point.y, 32)
        .stroke({ width: 2, color: 0xf0dfb9, alpha: 0.85 })
}

function destroyWorld() {
    world.destroy({ children: true })
}
</script>

<Container
    width={960}
    height={640}
    pixiChildren={[world]}
    on-before-destroy={destroyWorld}
/>
```

<!-- @include: ./_display-object.md -->
