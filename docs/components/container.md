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

## Flex layout

`display="flex"` or any container layout property such as `flexDirection`,
`justifyContent`, `alignItems`, `gap`, or `padding` makes the container manage
its direct children through Yoga. Children already mounted are enrolled if the
container becomes flex reactively. If its last layout property returns to
`undefined`, Yoga is detached again and ordinary PixiJS positioning resumes.

```html
<Container
  width={480}
  height={240}
  display="flex"
  flexDirection="row"
  justifyContent="space-evenly"
  alignItems="center"
  padding={[16, 24]}
  gap={12}
>
  <Rect width={80} height={80} color="#38bdf8" />
  <Rect width={80} height={120} color="#8b5cf6" />
</Container>
```

Two-value spacing arrays use `[vertical, horizontal]`; four-value arrays use
`[top, right, bottom, left]`. Zero is a valid reactive value.

Use `display="none"` to remove an object from Yoga and hide its rendered
subtree. Switching it back to `flex` restores it at its declared child order.

## Parent-relative layout

CanvasEngine automatically creates a lightweight Yoga containing box when a
child uses values that need its direct parent, such as percentage dimensions,
`right`/`bottom` insets, margins, or flex-item properties. The parent does not
need `display="flex"` for an absolute inset panel to use its numeric dimensions:

```html
<Container width={720} height={220}>
  <Container
    positionType="absolute"
    top={22}
    right={28}
    bottom={22}
    left={34}
  />
</Container>
```

Only children that depend on this containing box are enrolled. Ordinary PixiJS
siblings keep their `x`/`y` positioning. The automatic box is removed when its
last dependent child is removed or stops using parent-relative values.

## Full-screen centered GUI

Percentage dimensions follow the canvas and are recalculated after a renderer resize. A column flex container can center a complete GUI group on both axes:

```html
<Canvas backgroundColor="#08111f">
  <Container
    width="100%"
    height="100%"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    gap={16}
  >
    <Loading size={40} />
    <Text text="Loading area..." color="white" size={18} />
  </Container>
</Canvas>
```

Numeric dimensions supplied by signals can start at zero and update after mount; nested flex containers will use the new dimensions for their next layout calculation.

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
