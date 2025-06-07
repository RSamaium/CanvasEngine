[] If Viewport is loaded async (in a condition and changes to true after a while), the tracked element flashes during movement.

```html
<script>
  import { signal } from "canvasengine";
  import MyViewport from "./viewport.ce";
  const display = signal(false);

  setTimeout(() => {
    display.set(true);
  }, 1000);
</script>

<Canvas width="100%" height="100%" >
  @if (display) {
     <MyViewport />
  }
</Canvas>
```

[X] if you assign a value to an array, must add and update

```js
const val = signal([])
val()[2] = 'test'  // must add because before value is undefined
```

[] Test ViewPort

[] Filer blur + Tilemap + Viewport = bug