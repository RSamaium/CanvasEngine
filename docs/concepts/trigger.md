# Trigger

Trigger is a type of signal that can be used to pass data to a component. They are created using the `trigger` function. For example:

```html
<script>
  import { trigger, on } from 'canvasengine';

  const click = trigger()

  on(click, () => {
    console.log('Click')
  })
</script>

<Rect x="0" y="0" width="10" height="10" color="red" @click />
```