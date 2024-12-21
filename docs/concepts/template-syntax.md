# Template Syntax

## Static properties

You can use static properties in your components.

```html
<Text text="Hello World" />
```

## Binding properties

You can use reactive properties in your components. Use the `{}` syntax to bind a property.
```html
<Text text={text} />

<script>
  const text = 'Hello World';
</script>
```

::: tip
If the attribute name is the same as the variable, you can simplify:

```html
<Text text />

<script>
  const text = 'Hello World';
</script>
```
:::

## Event listeners

You can use event listeners in your components. Use the `@` prefix to bind an event listener.

```html
<Rect width="100" height="100" color="red" @click={click} />

<script>
  const click = () => {
    console.log("clicked");
  };
</script>
```

::: tip
If the attribute name is the same as the variable, you can simplify:

```html
<Rect width="100" height="100" color="red" @click />

<script>
  const click = () => {
    console.log("clicked");
  };
</script>
```
:::

::: tip
You can use arrow functions in your event listeners.

```html
<Rect width="100" height="100" color="red" @click={() => console.log("clicked")} />
```
:::

> Use PixiJS events (https://pixijs.download/release/docs/scene.Container.html)

## Conditional rendering

You can use the `@if` directive to conditionally render a component.

```angular-html
<Container>
   @if (show) {
     <Text text="Hello World" />
   }
</Container>

<script>
  const show = true;
</script>
```

> `@if` cannot be used in the root, so we put it in `Container`

## Loops

You can use the `@for` directive to loop over an array.

```angular-html
<Container>
  @for (item of items) {
    <Text text={item} />
  }
</Container>

<script>
  const items = ['Hello', 'World'];
</script>
```

> `@for` cannot be used in the root, so we put it in `Container`

::: warning With objects

`item` is transformed into a signal (see chapter on reactivity).

```angular-html
<Container>
  @for (item of items) {
    <Text text={item.text} /> <!-- error because item is a signal -->
  }
</Container>


<script>
  const items = [{
    text: 'Hello'
  }, {
    text: 'World'
  }];
</script>
```

To fix it, you can “undo” the transformation by signaling on the property.

```angular-html
<Container>
  @for (item of items) {
    <Text text={@item.text} />
  }
</Container>
```

Use `@` to “undo” the transformation.
:::
