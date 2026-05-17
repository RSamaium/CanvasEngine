# Template Syntax

<script setup>
import conditionalRenderingExample from './examples/conditional-rendering.js'
</script>

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

::: warning Grammar
Literal `@` prefixes inside expressions are no longer supported. Only template directives such as `@if`, `@else`, and `@for` use the `@` prefix.
:::

### Expressions and computed

The compiler only wraps expressions containing a function call in `computed`. Simple expressions stay as-is.

```html
<Text text={1 + 1} />
<Text text={nb() + 1} />
```

Compiles to:

```js
h(Text, { text: 1 + 1 })
h(Text, { text: computed(() => nb() + 1) })
```

## Event listeners

You can use event listeners in your components

```html
<Rect width={100} height={100} color="red" click={click} />

<script>
  const click = () => {
    console.log("clicked");
  };
</script>
```

::: tip
If the attribute name is the same as the variable, you can simplify:

```html
<Rect width={100} height={100} color="red" click />

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
<Rect width={100} height={100} color="red" click={() => console.log("clicked")} />
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

### @if/@else if/@else

You can use `@else if` and `@else` to create more complex conditional logic:

```angular-html
<Container>
   @if (score() >= 90) {
     <Text text="Grade: A+" color="gold" />
   }
   @else if (score() >= 80) {
     <Text text="Grade: A" color="green" />
   }
   @else if (score() >= 70) {
     <Text text="Grade: B" color="blue" />
   }
   @else if (score() >= 60) {
     <Text text="Grade: C" color="orange" />
   }
   @else {
     <Text text="Grade: F" color="red" />
   }
</Container>

<script>
  const score = signal(85);
</script>
```

### Interactive Example

Try this interactive example to see how `@if/@else if/@else` works:

<Playground v-bind="conditionalRenderingExample" />

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

If `item` is a signal (see chapter on reactivity), use `item()` to access it.

```angular-html
<Container>
  @for (item of items) {
    <Text text={item().text} />
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
