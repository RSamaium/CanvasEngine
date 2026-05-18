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

::: tip callbacks
Classic function props are callable directly for better DX.

```html
<script>
  const { onSelect } = defineProps()

  onSelect()
</script>
```

Reactive function values passed as signals stay signals and keep their existing behavior.
:::

::: tip

If you don't want to set the default values, just do:

```html
<script>
  const { title } = defineProps()
</script>
```
:::
