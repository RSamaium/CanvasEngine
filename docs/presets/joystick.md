# Joystick

<!-- @include: ./_before.md -->

## Usage

```html
<Canvas>
    <Joystick />
</Canvas>

<script>
    import { Joystick } from '@canvasengine/presets'
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

And use all the properties of the `Container` component.

### JoystickChangeEvent

The `onChange` callback receives a `JoystickChangeEvent` object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| x | number | X-axis position (-1 to 1) |
| y | number | Y-axis position (-1 to 1) |
| angle | number | Angle in degrees (0-360) |
| distance | number | Distance from center (0-1) |