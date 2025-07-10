# Children Components Slots

In CanvasEngine, you can access child components that are passed to a parent component.

```html
<Child>
    <Rect width={100} height={100} color="red" x={0} y={0} />
</Child>

<script>
    import Child from './child.ce'
</script>
```

How to access the children components in the `Child` component?

## Basic Usage

In the `Child` component, you can access the children components using the `defineProps()` function.

```html
<slot />

<script>
const { children } = defineProps()
const slot = children[0]
</script>
```

Children are accessible as an array, where `children[0]` is the first child, `children[1]` is the second child, etc.

## Multiple Children

You can pass multiple children to a component:

```html
@for (child of children) {
    <child />
}

<script>
    import { signal } from 'canvasengine'
    
    const { children } = defineProps()
</script>
```

## Dynamic Child Switching

You can dynamically switch between children using signals. You can also use the `attach` prop to attach a child to a container.

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
