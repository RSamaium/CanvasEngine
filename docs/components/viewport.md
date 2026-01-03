# Use Viewport component

Common example:

```html
<Viewport worldWidth="2000" worldHeight="2000" clamp={ {direction: 'all'} } />
```

## Properties

You can use all properties from Display Object

## Viewport Options

The Viewport component supports several options inherited from pixi-viewport:

| Option | Type | Description |
|--------|------|-------------|
| `drag` | boolean or object | Enable dragging the viewport |
| `wheel` | boolean or object | Enable mouse wheel scrolling |
| `pinch` | boolean or object | Enable pinch to zoom |
| `decelerate` | boolean or object | Enable deceleration (momentum) after dragging |
| `clamp` | object | Restrict viewport movement |

Example with options:

```html
<Viewport 
  worldWidth="2000" 
  worldHeight="2000" 
  drag={true}
  wheel={true}
  pinch={true}
  decelerate={true}
  clamp={ {direction: 'all'} } 
/>
```

## Viewport Events

The Viewport component supports all events from pixi-viewport:

| Event | Description |
|-------|-------------|
| `bounce-x-end` | Fired when bounce on the x-axis ends |
| `bounce-x-start` | Fired when bounce on the x-axis starts |
| `bounce-y-end` | Fired when bounce on the y-axis ends |
| `bounce-y-start` | Fired when bounce on the y-axis starts |
| `clicked` | Fired when viewport is clicked |
| `drag-end` | Fired when drag ends |
| `drag-start` | Fired when drag starts |
| `frame-end` | Fired when frame ends |
| `mouse-edge-end` | Fired when mouse-edge ends |
| `mouse-edge-start` | Fired when mouse-edge starts |
| `moved` | Fired when viewport moves |
| `moved-end` | Fired when viewport stops moving |
| `pinch-end` | Fired when pinch ends |
| `pinch-start` | Fired when pinch starts |
| `snap-end` | Fired when snap ends |
| `snap-start` | Fired when snap starts |
| `snap-zoom-end` | Fired when snap-zoom ends |
| `snap-zoom-start` | Fired when snap-zoom starts |
| `wheel-scroll` | Fired when mouse wheel is scrolled |
| `zoomed` | Fired when viewport is zoomed |
| `zoomed-end` | Fired when viewport stops zooming |

Example with event:

```html
<Viewport 
  worldWidth="2000" 
  worldHeight="2000"
/>
```

## Viewport Follow Directive

The `viewportFollow` directive allows an element to be followed by the viewport. When applied, the viewport will automatically center on the element as it moves.

This directive must be used within a `Viewport` component context.

### Usage

```html
<Viewport worldWidth="2000" worldHeight="2000" clamp={ {direction: 'all'} }>
    <Rect viewportFollow x={0} y={0} width={100} height={100} color="red" />
</Viewport>

<script>
    const viewportFollow = true // null to disable
</script>
```

In this example, the red rectangle will be followed by the viewport, keeping it centered in the view as it moves around within the 2000x2000 world space.

### Usage with options

```html
<Viewport worldWidth="2000" worldHeight="2000" clamp={ {direction: 'all'} }>
    <Rect viewportFollow x={0} y={0} width={100} height={100} color="red" />
</Viewport>

<script>
    const viewportFollow = {
        speed: 0.1,
        acceleration: 0.1,
        radius: 100
    }
</script>
```

- `speed` number 0 optional to follow in pixels/frame (0=teleport to location)
- `acceleration` number optional set acceleration to accelerate and decelerate at this rate; speed cannot be 0 to use acceleration
- `radius` number optional radius (in world coordinates) of center circle where movement is allowed without moving the viewport * @returns {Viewport} this

### Requirements

- Must be used on an element that is a child of a `Viewport` component
- The parent `Viewport` component must have defined dimensions (`worldWidth` and `worldHeight`)

::: warning
**Important**: When an element has `viewportFollow` set to `true`, it will automatically disable the dragging functionality of the parent viewport. This is by design as viewport dragging would conflict with the following behavior.
:::

## Performance Optimization

When rendering large numbers of elements (1000+) inside a Viewport, consider these optimization strategies:

### 1. Viewport Culling

The `viewportCull` directive automatically hides elements outside the visible area, significantly reducing render overhead:

```html
<Viewport worldWidth="5000" worldHeight="5000" drag={true}>
  <Container viewportCull={true}>
    @for (item of items) {
      <Sprite image={item().image} x={item().x} y={item().y} />
    }
  </Container>
</Viewport>
```

::: tip
Culling is most effective when only a small portion of the world is visible at once. If most elements are always on screen, culling overhead may not be worth it.
:::

### 2. Reduce Signal Granularity

Instead of creating signals for every animated property, use direct Pixi manipulation in `tick()`:

```html
<script>
  import { tick, mount } from 'canvasengine';
  
  // BAD: 5 signals per element = expensive with 1000+ elements
  const items = signal(data.map(d => ({
    x: signal(d.x),
    y: signal(d.y),
    rotation: signal(0),    // Don't do this for animations!
    alpha: signal(1),       // Don't do this for animations!
    scale: signal(1),       // Don't do this for animations!
  })));
  
  // GOOD: Only position signals, animate imperatively
  const items = signal(data.map(d => ({
    x: signal(d.x),
    y: signal(d.y),
    rotationSpeed: Math.random() * 0.1,
  })));
  
  tick((tickValue, element) => {
    const viewport = element.componentInstance.children[0];
    viewport.children.forEach((sprite, i) => {
      sprite.rotation += items()[i].rotationSpeed;
    });
  });
</script>
```

### 3. Throttle Updates

For non-critical animations, update every N frames instead of every frame:

```html
<script>
  tick((tickValue) => {
    if (tickValue.frame % 2 !== 0) return; // Skip every other frame
    
    // Animation logic here
  });
</script>
```

### 4. Level of Detail (LOD)

Reduce animation complexity based on element count:

```html
<script>
  tick((tickValue, element) => {
    const count = items().length;
    
    sprites.forEach(sprite => {
      sprite.rotation += 0.01; // Always animate rotation
      
      if (count < 3000) {
        sprite.alpha = Math.sin(tickValue.frame * 0.05); // Alpha only below 3k
      }
      if (count < 1000) {
        sprite.scale.set(1 + Math.sin(tickValue.frame * 0.02) * 0.1); // Scale only below 1k
      }
    });
  });
</script>
```

### Performance Summary

| Element Count | Recommended Strategy |
|---------------|---------------------|
| < 500 | Full reactivity (signals for all props) |
| 500 - 2000 | Imperative animations + position signals |
| 2000 - 5000 | + Viewport culling + throttled updates |
| > 5000 | + LOD + consider chunked rendering |

<!-- @include: ./_display-object.md -->
