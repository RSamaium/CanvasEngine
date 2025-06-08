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

You can use event listeners in your components

```html
<Rect width="100" height="100" color="red" click={click} />

<script>
  const click = () => {
    console.log("clicked");
  };
</script>
```

::: tip
If the attribute name is the same as the variable, you can simplify:

```html
<Rect width="100" height="100" color="red" click />

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
<Rect width="100" height="100" color="red" click={() => console.log("clicked")} />
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

You can use the `@for` directive to loop over an array or an object.

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

::: warning With objects array

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

To fix it, you can "undo" the transformation by signaling on the property.

```angular-html
<Container>
  @for (item of items) {
    <Text text={@item.text} />
  }
</Container>
```

Use `@` to "undo" the transformation.
:::

### With objects

You can use the `@for` directive to loop over an object.

```angular-html
<Container>
  @for ((item, key) of items) {
    <Text text={item} /> - <Text text={key} />
  }
</Container>

<script>
  const items = { 'Hello': 'World', 'Foo': 'Bar' }
</script>
```

### Advanced usage

The `@for` directive supports advanced iteration options:

#### Using method calls

You can iterate over the result of a function call:

```html
<Container>
  @for (item of getItems()) {
    <Text text={item} />
  }
</Container>

<script>
  function getItems() {
    return ['Hello', 'World'];
  }
</script>
```

#### Using method calls with parameters

You can pass parameters to the function:

```html
<Container>
  @for (item of getItems(5, 'prefix')) {
    <Text text={item} />
  }
</Container>

<script>
  function getItems(count, prefix) {
    return Array.from({length: count}, (_, i) => `${prefix}-${i+1}`);
  }
</script>
```

#### Using object properties and methods

You can iterate over object properties and methods:

```html
<Container>
  @for (sprite of sprites.items) {
    <Sprite texture={sprite.texture} />
  }
</Container>

<script>
  const sprites = {
    items: [
      { texture: 'player.png' },
      { texture: 'enemy.png' }
    ]
  };
</script>
```

Or combine object properties with method calls:

```html
<Container>
  @for (sprite of gameState.getVisibleSprites(maxCount)) {
    <Sprite texture={sprite.texture} />
  }
</Container>

<script>
  const maxCount = 10;
  const gameState = {
    getVisibleSprites(limit) {
      // Return only visible sprites, limited by count
      return sprites.filter(s => s.visible).slice(0, limit);
    }
  };
</script>
```