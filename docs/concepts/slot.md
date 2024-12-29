# Children Components Slots

In CanvasEngine, you can access child components that are passed to a parent component.

```html
<Child>
    <Rect width="100" height="100" color="red" x="0" y="0" />
    <Rect width="100" height="100" color="green" x="0" y="0" />
</Child>

<script>
    import Child from './child.ce'
</script>
```

How to access the children components in the `Child` component?

## Basic Usage

In the `Child` component, you can access the children components using the `defineProps()` function.

```typescript
const { children } = defineProps()
```

Children are accessible as an array, where `children[0]` is the first child, `children[1]` is the second child, etc.

## Attaching Children to Containers

To attach a child to a Container component, use the `attach` prop:

```html
<Container x="10" y="10" attach={child} />

<script>
    const { children } = defineProps()
    const child = children[0] // children[0] is the first child
</script>
```

## Dynamic Child Switching

You can dynamically switch between children using signals:

```html
<Container attach={activeChild} />

<script>
    import { signal } from 'canvasengine'
    
    const { children } = defineProps()
    const activeChild = signal(children[0])

    // Switch to second child after 1 second
    setTimeout(() => {
        activeChild.set(children[1])
    }, 1000)
</script>
```

This pattern is useful for creating dynamic interfaces where you need to swap components based on certain conditions or user interactions.
