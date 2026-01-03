# Navigation Component

::: Warning Experimental
This component is experimental and may change in the future.
:::

<script setup>
import focusNavigationDomExample from './examples/focus-navigation-dom.js'
</script>

The `Navigation` component provides a flexible and primitive focus navigation system for CanvasEngine. It allows you to manage focus navigation between focusable child elements using keyboard, gamepad, or programmatic control.

This component is especially useful for creating menu systems, lists, and any interface that requires keyboard/gamepad navigation.

## Basic Usage

```html
<Navigation tabindex={0}>
  <Button tabindex={0} text="Button 1" />
  <Button tabindex={1} text="Button 2" />
  <Button tabindex={2} text="Button 3" />
</Navigation>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `tabindex` | `number` | Focus index for the container (default: 0 if present) |
| `controls` | `Controls \| Signal<Controls>` | Controls configuration (you drive `tabindex` updates in your handlers) |
| `onFocusChange` | `(index: number, element: Element \| null) => void` | Callback when focus changes |
| `autoScroll` | `boolean \| ScrollOptions` | Enable automatic scrolling to focused element (default: false) |
| `viewport` | `Viewport` | Viewport instance to use for scrolling (optional, uses context viewport by default) |

You can also use all properties from [DisplayObject](/components/display-object).

## Making Elements Focusable

To make an element focusable, add a `tabindex` attribute:

### Canvas Components

For Canvas components (Button, Sprite, Rect, etc.), use the `tabindex` prop directly:

```html
<Navigation tabindex={0}>
  <Button tabindex={0} text="Item 1" />
  <Button tabindex={1} text="Item 2" />
  <Button tabindex={2} text="Item 3" />
</Navigation>
```

### DOM Elements

For DOM elements (inside DOMContainer), use `attrs.tabindex`:

```html
<Navigation tabindex={0}>
  <DOMContainer>
    <button attrs={{ tabindex: 0 }}>Button 1</button>
    <button attrs={{ tabindex: 1 }}>Button 2</button>
    <button attrs={{ tabindex: 2 }}>Button 3</button>
  </DOMContainer>
</Navigation>
```

## DOM Navigation with Scoped Styles

Here's a complete example demonstrating focus navigation within a `DOMContainer` with scoped CSS styling. This example shows how keyboard controls can be used to navigate through DOM buttons, with visual feedback through focus states.

<Playground v-bind="focusNavigationDomExample" />

### Key Features

- **Keyboard Navigation**: Use arrow keys (up/down) to navigate through the button list
- **Gamepad Support**: Automatically works with gamepad directional buttons
- **Action Trigger**: Press Space or Enter to trigger button action
- **Scoped Styles**: CSS is scoped to the playground instance and properly injected
- **Smooth Transitions**: Visual feedback with hover and focus states via CSS
- **Auto-Scroll**: Container has overflow handling for scrollable content

## Navigation with Controls

The `Navigation` wires the Controls directive, but you drive navigation by updating
the `tabindex` signal in your handlers (see `sample/src/focus-navigation-dom.ce`).

```html
<script>
import { signal, createTabindexNavigator } from 'canvasengine'

const tabindex = signal(0)
const items = signal([0, 1, 2])
const nav = createTabindexNavigator(tabindex, { count: () => items().length }, 'wrap')

const controls = signal({
  up: {
    repeat: true,
    bind: 'up',
    throttle: 150,
    keyDown() {
      nav.next(-1)
    }
  },
  down: {
    repeat: true,
    bind: 'down',
    throttle: 150,
    keyDown() {
      nav.next(1)
    }
  },
  action: {
    bind: ['space', 'enter']
  }
})
</script>

<Navigation tabindex={tabindex} controls={controls}>
  <Button tabindex={0} text="Item 1" />
  <Button tabindex={1} text="Item 2" />
  <Button tabindex={2} text="Item 3" />
</Navigation>
```

## Automatic Scrolling with Viewport

When using a `Viewport` with a long list, you can enable automatic scrolling to keep the focused element visible:

```html
<Viewport worldWidth={2000} worldHeight={5000}>
  <Navigation tabindex={0} autoScroll={true}>
    <Button tabindex={0} y={0} text="Item 1" />
    <Button tabindex={1} y={100} text="Item 2" />
    <Button tabindex={2} y={200} text="Item 3" />
    <!-- ... many more items ... -->
    <Button tabindex={49} y={4900} text="Item 50" />
  </Navigation>
</Viewport>
```

### Scroll Options

You can customize the scroll behavior:

```html
<Navigation 
  tabindex={0} 
  autoScroll={{ 
    padding: 50,    // Padding around the element in pixels (default: 0)
    smooth: true,   // Enable smooth scrolling animation (default: false)
    center: true,   // Center the element in the viewport (default: true)
    duration: 300   // Animation duration in ms if smooth=true (default: 300)
  }}
>
  <!-- ... -->
</Navigation>
```

## Reacting to Focus Changes

### Using onFocusChange Callback

```html
<script>
import { signal } from 'canvasengine'

const selectedIndex = signal(0)

const handleFocusChange = (index, element) => {
  if (index !== null) {
    selectedIndex.set(index)
    console.log('Focus changed to index:', index)
  }
}
</script>

<Navigation 
  tabindex={0} 
  onFocusChange={handleFocusChange}
>
  <Button tabindex={0} text="Item 1" />
  <Button tabindex={1} text="Item 2" />
  <Button tabindex={2} text="Item 3" />
</Navigation>
```

### Two-way Synchronization with Signals

You can pass a signal directly to the `tabindex` property of the `Navigation`. This enables two-way synchronization:
1. When the focus changes (via keyboard, gamepad, or `FocusManager`), the signal is automatically updated.
2. When you update the signal manually, the focus automatically moves to the new index.

> [!IMPORTANT]
> When using a signal for `tabindex`, you **should not** update the same signal inside `onFocusChange` or `handleFocusChange`, as this is handled automatically and could lead to unnecessary updates.

```html
<script>
import { signal } from 'canvasengine'

const selectedIndex = signal(0)

// You can change the focus at any time by updating the signal
const goToSecondItem = () => {
  selectedIndex.set(1)
}
</script>

<!-- The signal is automatically synced with the focus state -->
<Navigation tabindex={selectedIndex}>
  <Button tabindex={0} text="Item 1" />
  <Button tabindex={1} text="Item 2" />
  <Button tabindex={2} text="Item 3" />
</Navigation>

<Button text="Go to Item 2" click={goToSecondItem} />
```

### Tabindex Boundary Helper

When you update `tabindex` yourself (for example, from Controls), you may want to
handle bounds (wrap or clamp). Use `createTabindexNavigator` to keep that logic in one place:

```html
<script>
import { signal, createTabindexNavigator } from 'canvasengine'

const selectedIndex = signal(0)
const items = signal([0, 1, 2])

const nav = createTabindexNavigator(
  selectedIndex,
  { count: () => items().length },
  'wrap'
)
</script>
```

### Using Hooks

You can use reactive hooks to track focus state:

```html
<script>
import { useFocusIndex, useFocusedElement, useFocusChange } from 'canvasengine'
import { mount, effect } from 'canvasengine'

mount((element) => {
  // Find Navigation
  const findNavigation = (el) => {
    if (el.tag === 'Navigation') return el
    if (el.children) {
      for (const child of Array.isArray(el.children) ? el.children : [el.children]) {
        const found = findNavigation(child)
        if (found) return found
      }
    }
    return null
  }

  const navigation = findNavigation(element)
  if (navigation) {
    const containerId = navigation.componentInstance.getContainerId()
    
    // Get current index signal
    const focusIndex = useFocusIndex(containerId)
    effect(() => {
      console.log('Current focus index:', focusIndex?.())
    })
    
    // Get focused element signal
    const focusedElement = useFocusedElement(containerId)
    effect(() => {
      const element = focusedElement?.()
      if (element) {
        console.log('Focused element:', element)
      }
    })
    
    // Subscribe to focus changes
    useFocusChange(containerId, (index, element) => {
      console.log('Focus changed to index', index)
    })
  }
})
</script>
```

## Nested Navigation

Nested `Navigation` instances are scoped: the parent only registers focusables
in its own subtree and ignores children managed by nested containers.

## Programmatic Navigation

You can control focus programmatically using the `FocusManager`:

```html
<script>
import { focusManager } from 'canvasengine'
import { mount } from 'canvasengine'

mount((element) => {
  const navigation = findNavigation(element)
  if (navigation) {
    const containerId = navigation.componentInstance.getContainerId()
    
    // Set focus to specific index
    focusManager.setIndex(containerId, 2)
    
    // Navigate by updating the signal
    const indexSignal = focusManager.getCurrentIndexSignal(containerId)
    if (indexSignal) {
      indexSignal.set(1)
    }
    
    // Get element at index
    const element = focusManager.getElement(containerId, 1)
  }
})
</script>
```

## Complete Example

Here's a complete example showing a menu with visual feedback:

```html
<script>
import { signal, computed } from 'canvasengine'

const selectedIndex = signal(0)
const items = signal([
  { id: 0, label: "Item 1", color: "#ff6b6b" },
  { id: 1, label: "Item 2", color: "#4ecdc4" },
  { id: 2, label: "Item 3", color: "#45b7d1" },
  { id: 3, label: "Item 4", color: "#f9ca24" },
  { id: 4, label: "Item 5", color: "#6c5ce7" },
])

const controls = signal({
  up: {
    repeat: true,
    bind: 'up',
    keyDown() {
      console.log('Up pressed')
    }
  },
  down: {
    repeat: true,
    bind: 'down',
    keyDown() {
      console.log('Down pressed')
    }
  },
  action: {
    bind: ['space', 'enter'],
    keyDown() {
      console.log('Action pressed on item', selectedIndex())
    }
  }
})

const handleFocusChange = (index, element) => {
  if (index !== null) {
    selectedIndex.set(index)
  }
}
</script>

<Canvas backgroundColor="#2c3e50">
  <Container x={400} y={300}>
    <Text 
      text="Focus Navigation Example" 
      x={0} 
      y={-250} 
      anchor={{ x: 0.5, y: 0.5 }}
      style={{ fontSize: 32, fill: "#ecf0f1" }}
    />
    
    <Navigation 
      tabindex={0} 
      controls={controls}
      onFocusChange={handleFocusChange}
    >
      <Container y={-100}>
        @for (item of items) {
          <Container y={item().id * 80}>
            <Rect
              tabindex={item().id}
              width={300}
              height={60}
              x={0}
              y={0}
              anchor={{ x: 0.5, y: 0.5 }}
              color={item().color}
              alpha={computed(() => selectedIndex() === item().id ? 1 : 0.5)}
            />
            <Text
              text={item().label}
              x={0}
              y={0}
              anchor={{ x: 0.5, y: 0.5 }}
              style={{ fontSize: 24, fill: "#ffffff" }}
            />
            @if (selectedIndex() === item().id) {
              <Rect
                width={320}
                height={80}
                x={0}
                y={0}
                anchor={{ x: 0.5, y: 0.5 }}
                color="#ffffff"
                alpha={0.2}
              />
            }
          </Container>
        }
      </Container>
    </Navigation>
  </Container>
</Canvas>
```

## Long List with Viewport

For long lists that require scrolling:

```html
<script>
import { signal } from 'canvasengine'

const items = signal(
  Array.from({ length: 50 }, (_, i) => ({
    id: i,
    label: `Item ${i + 1}`,
    y: i * 100
  }))
)

const controls = signal({
  up: { repeat: true, bind: 'up' },
  down: { repeat: true, bind: 'down' },
  action: { bind: ['space', 'enter'] }
})
</script>

<Viewport worldWidth={2000} worldHeight={5000}>
  <Navigation 
    tabindex={0} 
    controls={controls}
    autoScroll={{ smooth: true, center: true }}
  >
    @for (item of items) {
      <Button 
        tabindex={item().id} 
        y={item().y} 
        text={item().label}
      />
    }
  </Navigation>
</Viewport>
```

## API Reference

### FocusManager

The `FocusManager` is a singleton that manages all focus containers. You can access it directly:

```typescript
import { focusManager } from 'canvasengine'

// Register a container (done automatically by Navigation)
focusManager.registerContainer(id, data)

// Navigate
focusManager.navigate(containerId, 'next' | 'previous')

// Set focus index
focusManager.setIndex(containerId, index)

// Get element at index
const element = focusManager.getElement(containerId, index)

// Get signals
const indexSignal = focusManager.getCurrentIndexSignal(containerId)
const elementSignal = focusManager.getFocusedElementSignal(containerId)
```

### Hooks

#### `useFocusIndex(containerId: string)`

Returns the current focus index signal for a container.

```typescript
const focusIndex = useFocusIndex('my-container')
effect(() => {
  console.log('Current index:', focusIndex?.())
})
```

#### `useFocusedElement(containerId: string)`

Returns the current focused element signal for a container.

```typescript
const focusedElement = useFocusedElement('my-container')
effect(() => {
  const element = focusedElement?.()
  if (element) {
    console.log('Focused element:', element)
  }
})
```

#### `useFocusChange(containerId: string, callback: (index: number | null, element: Element | null) => void)`

Subscribes to focus changes and calls the callback whenever focus changes.

```typescript
useFocusChange('my-container', (index, element) => {
  console.log('Focus changed to index', index)
})
```

## Best Practices

1. **Use sequential tabindex values**: Start from 0 and increment by 1 for each focusable element
2. **Handle focus changes reactively**: Use `onFocusChange` or hooks to update UI state
3. **Enable auto-scroll for long lists**: Use `autoScroll={true}` when elements might be outside the viewport
4. **Combine with Controls**: Provide a `controls` prop for automatic keyboard/gamepad navigation
5. **Visual feedback**: Always provide visual indication of which element is focused

## Limitations

- Focusable elements must be direct or nested children of the `Navigation`
- Tabindex values should be unique within a container
- Elements with `tabindex < 0` are not registered as focusable

<!-- @include: ./_display-object.md -->
