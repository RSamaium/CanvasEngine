# Tick

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
