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
      keyDown() {
        y.update((y) => y + speed());
        direction.set(Direction.Down);
      },
    },
    up: {
      repeat: true,
      bind: ['up', 'top_left', 'top_right'],
      keyDown() {
        y.update((y) => y - speed());
        direction.set(Direction.Up);
      },
    },
    left: {
      repeat: true,
      bind: "left",
      keyDown() {
        x.update((x) => x - speed());
        direction.set(Direction.Left);
      },
    },
    right: {
      repeat: true,
      bind: "right",
      keyDown() {
        x.update((x) => x + speed());
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

## Getting the Controls Instance

To access the controls directive instance and use its methods, you can use the `mount()` hook:

```html
<script>
import { signal, mount } from "canvasengine";

// ... controls configuration ...

mount((element) => {
  const controlsInstance = element.directives.controls;
  
  if (controlsInstance) {
    // Get a specific control
    const leftControl = controlsInstance.getControl('left');
    
    // Get all controls
    const allControls = controlsInstance.getControls();
    
    // Stop listening to inputs
    controlsInstance.stopInputs();
    
    // Resume listening to inputs
    controlsInstance.listenInputs();
    
    // Programmatically trigger a control
    controlsInstance.applyControl('right', true); // keydown
    controlsInstance.applyControl('right', false); // keyup
    
    // Access the controls options
    const options = controlsInstance.options;
  }
});
</script>
```

### Available Methods

The `KeyboardControls` directive instance provides the following methods:

- `getControl(inputName: string)` - Get a specific control by input name
- `getControls()` - Get all bound controls
- `applyControl(controlName: string, isDown?: boolean)` - Programmatically trigger a control
- `stopInputs()` - Stop listening to keyboard inputs
- `listenInputs()` - Resume listening to keyboard inputs
- `options` - Access the controls configuration object