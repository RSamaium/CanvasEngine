# Use Controls directive

The controls directive allows you to control the movement and actions of a display object using keyboard and gamepad inputs. It automatically supports both input methods when available.

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

The `ControlsDirective` instance provides the following methods:

- `getControl(inputName: string)` - Get a specific control by input name
- `getControls()` - Get all bound controls
- `applyControl(controlName: string, isDown?: boolean)` - Programmatically trigger a control
- `stopInputs()` - Stop listening to inputs (both keyboard and gamepad)
- `listenInputs()` - Resume listening to inputs (both keyboard and gamepad)
- `options` - Access the controls configuration object
- `keyboard` - Get the keyboard controls instance (if available)
- `gamepad` - Get the gamepad controls instance (if available)

## Gamepad Support

The controls directive automatically detects and activates gamepad support when `joypad.js` is available in your project. Gamepad controls work alongside keyboard controls, allowing players to use either input method seamlessly.

### Automatic Activation

Gamepad support is automatically enabled when:
1. `joypad.js` library is loaded in your project
2. A gamepad is connected to the system

No additional configuration is required for basic gamepad functionality.

### Gamepad Configuration

You can customize gamepad behavior by adding a `gamepad` property to your controls configuration:

```html
<script>
import { signal } from "canvasengine";

const controls = signal({
  up: {
    repeat: true,
    bind: Input.Up,
    keyDown() {
      // Handle up movement
    }
  },
  // ... other controls ...
  
  // Optional: Customize gamepad behavior
  gamepad: {
    enabled: true, // Enable/disable gamepad (default: true)
    buttonMapping: { // Map gamepad buttons to controls (optional)
      'button_0': 'action',  // A button -> action
      'button_1': 'back',    // B button -> back
      'button_9': 'back'     // Start button -> back
    },
    axisMapping: { // Map stick directions (optional)
      'top': 'up',
      'bottom': 'down',
      'left': 'left',
      'right': 'right'
    },
    moveInterval: 400, // Movement repeat interval in ms (default: 400)
    onConnect: () => console.log('Gamepad connected!'), // Optional callback
    onDisconnect: () => console.log('Gamepad disconnected!'), // Optional callback
    gamepadConnected: gamepadConnectedSignal // Optional signal to track connection status
  }
});
</script>
```

### Default Button Mapping

If not specified, the following default mappings are used:

- `button_0` → `action` control
- `button_1` → `back` control
- `button_9` → `back` control

### Default Axis Mapping

Analog stick movements are mapped to direction controls:

- `top` → `up`
- `bottom` → `down`
- `left` → `left`
- `right` → `right`

### Gamepad Connection Tracking

You can track gamepad connection status using a signal:

```html
<script>
import { signal } from "canvasengine";

// Create a signal to track gamepad connection status
const gamepadConnected = signal(false);

const controls = signal({
  // ... other controls ...
  gamepad: {
    enabled: true,
    // Signal will be automatically updated when gamepad connects/disconnects
    gamepadConnected: gamepadConnected,
    onConnect() {
      console.log('Gamepad connected!');
    },
    onDisconnect() {
      console.log('Gamepad disconnected!');
    }
  }
});

// Use the signal in your UI
// gamepadConnected() will be true when connected, false otherwise
</script>
```

### Accessing Gamepad Instance

You can access the gamepad controls instance to customize behavior at runtime:

```html
<script>
import { mount } from "canvasengine";

mount((element) => {
  const controlsInstance = element.directives.controls;
  
  if (controlsInstance && controlsInstance.gamepad) {
    // Update gamepad configuration
    controlsInstance.gamepad.updateGamepadConfig({
      enabled: true,
      buttonMapping: {
        'button_0': 'jump',
        'button_1': 'attack'
      }
    });
  }
});
</script>
```

### Installing joypad.js

To enable gamepad support, install the `joypad.js` library:

```bash
npm install joypad.js
```

Then import it in your project:

```javascript
import 'joypad.js';
```

The controls directive will automatically detect and use it.