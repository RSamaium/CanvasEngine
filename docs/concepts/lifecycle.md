# Lifecycle

Lifecycle is a core concept in Canvas Engine. It is used to manage the lifecycle of a component.

## Mounting

```html
<script>
  import { mount } from 'canvasengine';

  mount((element) => {
    console.log('Mounting', element);
  });
</script>

 <Rect x="5" y="5" width="10" height="10" color="red" />
```

## Unmount

To unmount a component, you can return a function from the mount function.

```html
<script>
  import { mount } from 'canvasengine';

  mount(() => {
     return () => {
      console.log('Unmounting');
     }
  });
</script>
```

## Tick

Use tick to run code on every frame.

```html
<script>
  import { tick } from 'canvasengine';

  tick((params: Tick) => {
    console.log('Tick');
  });
</script>
```

Params contains the following properties:

- `timestamp`: The current timestamp in milliseconds.
- `deltaTime`: The time elapsed since the last tick in milliseconds.
- `frame`: The current frame number.
- `deltaRatio`: The ratio of the delta time to the frame time.
