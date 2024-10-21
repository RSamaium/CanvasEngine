# Input props

Input props are 

```html
<script>
  const { title } = $props
</script>

<Text text={title} />
```

In this example, the `title` prop is passed to the `Text` component.

Use in component parent:

```html
<script>
 import MyComponent from './MyComponent.ce'
</script>

<MyComponent title="Hello World" />
```

## Children