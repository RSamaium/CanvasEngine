# Joystick

<!-- @include: ./_before.md -->

## Usage

### Basic Usage

```html
<Canvas>
    <Joystick />
</Canvas>

<script>
    import { Joystick } from '@canvasengine/presets'
</script>
```

### With Controls Integration

The Joystick can be automatically integrated with the controls system, similar to gamepad controls:

```html
<Canvas>
    <Rect controls={controlsConfig} x={x} y={y} />
    
    <Joystick 
        controls={element.directives.controls}
        outerColor="#34495e"
        innerColor="#3498db"
    />
</Canvas>

<script>
    import { signal, mount } from "canvasengine";
    import { Joystick } from "@canvasengine/presets";

    const x = signal(200);
    const y = signal(200);
    const speed = 10;

    const controls = signal({
        up: {
            repeat: true,
            bind: "up",
            keyDown() {
                y.update((y) => Math.max(0, y - speed));
            },
        },
        down: {
            repeat: true,
            bind: "down",
            keyDown() {
                y.update((y) => y + speed);
            },
        },
        left: {
            repeat: true,
            bind: "left",
            keyDown() {
                x.update((x) => Math.max(0, x - speed));
            },
        },
        right: {
            repeat: true,
            bind: "right",
            keyDown() {
                x.update((x) => x + speed);
            },
        },
        joystick: {
            enabled: true,
            directionMapping: {
                'top': 'up',
                'bottom': 'down',
                'left': 'left',
                'right': 'right',
                'top_left': ['up', 'left'],
                'top_right': ['up', 'right'],
                'bottom_left': ['down', 'left'],
                'bottom_right': ['down', 'right']
            },
            moveInterval: 50,
            threshold: 0.1
        }
    });

    mount((element) => {
        // The joystick will automatically use the controls from the Rect element
    });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| outer | string | - | Path to the outer joystick image |
| inner | string | - | Path to the inner joystick image |
| outerColor | string | - | Color of the outer joystick element |
| innerColor | string | - | Color of the inner joystick element |
| outerScale | `{ x: number; y: number }`| Scale of the outer joystick element |
| innerScale | `{ x: number; y: number }` | Scale of the inner joystick element |
| onChange | (data: JoystickChangeEvent) => void | - | Callback function triggered when joystick position changes |
| onStart | () => void | - | Callback function triggered when joystick interaction starts |
| onEnd | () => void | - | Callback function triggered when joystick interaction ends |
| controls | ControlsDirective \| JoystickControls | - | Controls instance to automatically apply joystick events to. Can be accessed via `element.directives.controls` |

And use all the properties of the `Container` component.

### JoystickChangeEvent

The `onChange` callback receives a `JoystickChangeEvent` object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| angle | number | Angle in degrees (0-360) |
| direction | Direction | Direction enum value (LEFT, RIGHT, TOP, BOTTOM, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT) |
| power | number | Power/distance from center (0-1) |

### Joystick Configuration

When using the joystick with the controls system, you can configure it in the controls configuration:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| enabled | boolean | true | Whether joystick controls are enabled |
| directionMapping | object | See below | Mapping of joystick directions to control names |
| moveInterval | number | 50 | Interval in milliseconds for repeating movement actions |
| threshold | number | 0.1 | Minimum power value (0-1) required to trigger movement |

#### Default Direction Mapping

```typescript
{
    'top': 'up',
    'bottom': 'down',
    'left': 'left',
    'right': 'right',
    'top_left': ['up', 'left'],
    'top_right': ['up', 'right'],
    'bottom_left': ['down', 'left'],
    'bottom_right': ['down', 'right']
}
```

You can override this mapping in your controls configuration. Diagonal directions can map to multiple controls (array) or a single control (string).