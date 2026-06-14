# Child Component

A child component is a component that is defined inside another component.

`child.ce`

```html
<Container>
  <Rect width={100} height={100} color="red" />
</Container>
```

`parent.ce`

```html
<Canvas>
  <Child />
</Canvas>

<script>
  import Child from "./child.ce";
</script>
```

## Input props

You can define input props for a child component.

`child.ce`
```html
<script>
  const { title } = defineProps({
    title: 'Hello World' // default value
  })

  console.log(title())
</script>

<Text text={title} />
```

In this example, the `title` prop is passed to the `Text` component.

> Not need to import `defineProps` in the child component.

Use in component parent:

`parent.ce`
```html
<Canvas>
  <Child title="Hello World" />
</Canvas>

<script>
 import Child from './child.ce'
</script>
```

::: tip
Note that retrieved properties, **even static ones**, are transformed into signals and you must read them into the child as signals.

Example: `title()`
:::

## Emits

Use `defineEmits()` when a child component needs to send an event to its parent.

`child.ce`

```html
<script>
  const { select } = defineEmits()

  const handleClick = () => {
    select({ id: 1 })
  }
</script>

<Rect width={100} height={100} color="red" click={handleClick} />
```

`parent.ce`

```html
<Canvas>
  <Child select={handleSelect} />
</Canvas>

<script>
  import Child from './child.ce'

  const handleSelect = (item) => {
    console.log(item)
  }
</script>
```

> Not need to import `defineEmits` in the child component.

::: tip callbacks compatibility
Classic function props in `defineProps()` are still supported for compatibility, but `defineEmits()` is recommended for child-to-parent events.
:::

::: tip

If you don't want to set the default values, just do:

```html
<script>
  const { title } = defineProps()
</script>
```
:::
