# Events

Events are a type of signal that can be used to pass data to a component. They are created using the `events` function. For example:

```html
<Rect x y width="10" height="10" color="red" @click={() => console.log('Clicked')} />
```

## Use callback function

```html
<script>
  import { events } from 'canvasengine';

  const click = (ev) => {
    console.log('Clicked', ev);
  }
</script>

<Rect x y width="10" height="10" color="red" @click />
```

> `@click` is a shorthand for `@click={click}`.

## All events

Use PixiJS events (https://pixijs.download/release/docs/scene.Container.html)