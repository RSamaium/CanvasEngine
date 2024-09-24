# Use Controls directive

It's a directive that allows you to control the movement of a display object.

Common example:

```html
<script>
import { signal } from "canvasengine";

enum Direction {
    Up,
    Down,
    Left,
    Right
}

const x = signal(0);
const y = signal(0);
const speed = signal(10);
const direction = signal(Direction.Down);

const controls = signal({
    down: {
      repeat: true,
      bind: ["down", 'bottom_right', 'bottom_left'],
      trigger() {
        y.update((y) => y + speed);
        direction.set(Direction.Down);
      },
    },
    up: {
      repeat: true,
      bind: ['up', 'top_left', 'top_right'],
      trigger() {
        y.update((y) => y - speed);
        direction.set(Direction.Up);
      },
    },
    left: {
      repeat: true,
      bind: "left",
      trigger() {
        x.update((x) => x - speed);
        direction.set(Direction.Left);
      },
    },
    right: {
      repeat: true,
      bind: "right",
      trigger() {
        x.update((x) => x + speed);
        direction.set(Direction.Right);
      },
    },
  });

</script>

<Sprite 
    image="path/to/image.png" 
    sheet = {
        {
            params: {
                direction
            }
        }
    }
    controls
    x
    y
/>
```