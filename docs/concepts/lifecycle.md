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

 <Rect x y width="10" height="10" color="red" />
```