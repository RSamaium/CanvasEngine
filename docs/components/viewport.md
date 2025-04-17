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
  drag-start={(event) => console.log('Drag started', event)}
/>
```

## Viewport Follow Directive

The `viewportFollow` directive allows an element to be followed by the viewport. When applied, the viewport will automatically center on the element as it moves.

This directive must be used within a `Viewport` component context.

### Usage

```html
<Viewport worldWidth="2000" worldHeight="2000" clamp={ {direction: 'all'} }>
    <Rect viewportFollow x="0" y="0" width="100" height="100" color="red" />
</Viewport>

<script>
    const viewportFollow = true
</script>
```

In this example, the red rectangle will be followed by the viewport, keeping it centered in the view as it moves around within the 2000x2000 world space.

### Requirements

- Must be used on an element that is a child of a `Viewport` component
- The parent `Viewport` component must have defined dimensions (`worldWidth` and `worldHeight`)

::: warning
**Important**: When an element has `viewportFollow` set to `true`, it will automatically disable the dragging functionality of the parent viewport. This is by design as viewport dragging would conflict with the following behavior.
:::

<!-- @include: ./_display-object.md -->
