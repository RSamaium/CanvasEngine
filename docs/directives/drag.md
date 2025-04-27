# Using the Drag Directive

The Drag directive allows you to make display objects draggable with the mouse or touch. This is useful for creating interactive elements that users can move around the canvas.

## Basic Usage

To make an element draggable, simply add the `drag` attribute to it:

```html
<Sprite image="path/to/image.png" drag />
```

## Configuration Options

You can configure the drag behavior by passing an object with options:

```html
<script>
import { signal } from "canvasengine";

const drag = {
  direction: 'all', // 'all', 'x', or 'y'
  snap: 10, // Optional: snap to grid with specified interval
  keyToPress: ['ShiftLeft', 'ShiftRight'], // Optional: keys that must be pressed to enable dragging
  start() {
    console.log("Drag started");
  },
  move(event) {
    console.log("Dragging", event.global.x, event.global.y);
  },
  end() {
    console.log("Drag ended");
  }
};
</script>

<Sprite image="path/to/image.png" drag={drag} />
```

### Available Options

- `direction`: Controls the axis of movement ('all', 'x', or 'y')
- `snap`: Optional number that determines grid snapping
- `keyToPress`: Optional array of key codes that must be pressed for dragging to work
- `start()`: Callback function triggered when dragging starts
- `move(event)`: Callback function called continuously during dragging
- `end()`: Callback function triggered when dragging ends

### Key Modifiers for Dragging

The `keyToPress` option allows you to require specific keyboard keys to be pressed for dragging to work. This is useful for creating more complex interactions or preventing accidental dragging.

```html
<script>
const drag = {
  // Only enable dragging when Shift key is pressed
  keyToPress: ['ShiftLeft', 'ShiftRight']
};
</script>

<Sprite image="path/to/image.png" drag={drag} />
```

You can use standard [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) values or common key names:

```html
<script>
// Examples of different key configurations
const dragWithShift = { keyToPress: ['shift'] };  // Either Shift key
const dragWithCtrl = { keyToPress: ['ctrl'] };    // Either Control key
const dragWithAlt = { keyToPress: ['alt'] };      // Either Alt key
const dragWithSpace = { keyToPress: ['space'] };  // Space bar
</script>
```

The drag operation will start only when the specified key is pressed during mouse/touch interaction, and will end if the key is released during dragging.

### Disabling Drag

To disable drag functionality on an element that previously had it, you can pass an empty object:

```html
<script>
// Enable drag
const dragEnabled = signal({
  direction: 'all'
});

// Later, to disable drag:
dragEnabled.set({});
</script>

<Sprite image="path/to/image.png" drag={dragEnabled} />
```

## Viewport Integration

When used within a Viewport, the Drag directive can automatically scroll the viewport when dragging elements near the edges. This is particularly useful for large game maps or workspaces.

To enable viewport scrolling, add the `viewport` property to your drag configuration:

```html
<script>
const drag = {
  // Basic drag options
  direction: 'all',
  keyToPress: ['space'], // Optional: require space bar to be pressed
  
  // Viewport scrolling options
  viewport: {
    edgeThreshold: 100, // Distance from edge to trigger scrolling (pixels)
    maxSpeed: 10        // Maximum scrolling speed
  }
};
</script>

<Viewport worldWidth={2000} worldHeight={2000}>
  <Sprite image="path/to/image.png" drag />
</Viewport>
```

### Viewport Options

- `edgeThreshold`: Distance in pixels from the viewport edge that triggers scrolling
- `maxSpeed`: Maximum speed of viewport scrolling when an element is dragged to the edge

::: warning
The drag directive is incompatible with elements that have `viewportFollow` enabled. If you want to make an element draggable that previously had viewport following enabled, you must set `viewportFollow` to `false` first:

```html
<script>
import { signal } from "canvasengine";

const viewportFollow = signal(false); // Must be false for drag to work properly
const drag = signal({
  direction: 'all'
});
</script>

<Sprite 
  image="path/to/image.png" 
  viewportFollow
  drag
/>
```
:::
