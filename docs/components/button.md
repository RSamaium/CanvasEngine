# Button

The Button component provides an interactive button with visual feedback for different states (normal, hover, pressed, disabled). It supports both sprite-based and graphics-based rendering approaches.

## Basic Usage

```html
<Button 
  text="Click Me" 
  width={150} 
  height={50}
  click={() => console.log("Button clicked!")} 
/>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` | `""` | Button text content |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `width` | `number` | `120` | Button width in pixels |
| `height` | `number` | `40` | Button height in pixels |
| `x` | `number` | `0` | Button X position |
| `y` | `number` | `0` | Button Y position |
| `alpha` | `number` | `1` | Button opacity (0-1) |
| `visible` | `boolean` | `true` | Button visibility |
| `style` | `ButtonStyle` | `{}` | Visual styling configuration |
| `cursor` | `string` | `"pointer"` | Button cursor |
| `controls` | `ControlsDirective \| JoystickControls` | - | Controls instance to automatically apply button events to. Can be accessed via `element.directives.controls` |
| `controlName` | `string` | - | Name of the control to trigger with `applyControl` when button is clicked |
| `shape` | `'rect' \| 'circle' \| 'ellipse'` | `'rect'` | Shape of the button background |
| `background` | `Element \| ComponentFunction` | - | Custom background component or element (replaces default background if provided) |
| `children` | `Element[]` | - | Custom children components for button content (takes priority over `text` if provided) |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `click` | `(event: FederatedPointerEvent) => void` | Fired when button is clicked |
| `hoverEnter` | `(event: FederatedPointerEvent) => void` | Fired when mouse enters button |
| `hoverLeave` | `(event: FederatedPointerEvent) => void` | Fired when mouse leaves button |
| `pressDown` | `(event: FederatedPointerEvent) => void` | Fired when button is pressed down |
| `pressUp` | `(event: FederatedPointerEvent) => void` | Fired when button is released |

## Button States

The button automatically manages four visual states:

- **Normal**: Default appearance
- **Hover**: When mouse is over the button
- **Pressed**: When button is being clicked
- **Disabled**: When button is not interactive

## Styling

### Background Colors

```html
<Button 
  text="Styled Button"
  style={{
    backgroundColor: {
      normal: "#28a745",
      hover: "#218838",
      pressed: "#1e7e34",
      disabled: "#6c757d"
    }
  }}
/>
```

### Text Styling

```html
<Button 
  text="Custom Text"
  style={{
    text: {
      fontSize: 18,
      fontFamily: "Arial",
      color: "#ffffff"
    }
  }}
/>
```

### Border Styling

```html
<Button 
  text="Bordered Button"
  style={{
    border: {
      radius: 8,
      width: 2,
      color: "#ffffff"
    }
  }}
/>
```

### Sprite-based Button

For more advanced styling, you can use different sprite textures for each state:

```html
<Button 
  text="Play Game"
  style={{
    textures: {
      normal: "/assets/button-normal.png",
      hover: "/assets/button-hover.png",
      pressed: "/assets/button-pressed.png",
      disabled: "/assets/button-disabled.png"
    }
  }}
/>
```

## Controls Integration

The Button can be automatically integrated with the controls system, similar to joystick controls:

```html
<Canvas>
  <Button 
    text="Jump" 
    controls={element.directives.controls}
    controlName="jump"
    width={120}
    height={40}
  />
</Canvas>

<script>
  import { signal, mount } from "canvasengine";
  import { Button } from "@canvasengine/core";

  const controls = signal({
    jump: {
      bind: "space",
      keyDown() {
        console.log("Jump!");
        // Jump logic here
      },
    },
  });

  mount((element) => {
    // The button will automatically trigger the "jump" control when clicked
  });
</script>
```

## Button Shapes

You can customize the button shape using the `shape` property:

### Rectangular Button (default)

```html
<Button 
  text="Rectangular"
  shape="rect"
  width={150}
  height={50}
/>
```

### Circular Button

```html
<Button 
  text="Circular"
  shape="circle"
  width={100}
  height={100}
/>
```

### Elliptical Button

```html
<Button 
  text="Elliptical"
  shape="ellipse"
  width={150}
  height={80}
/>
```

## Custom Content

You can provide custom content using children components instead of text:

### Button with Icon

```html
<Button shape="circle" width={80} height={80}>
  <Sprite image="icon.png" width={50} height={50} />
</Button>
```

### Button with Multiple Elements

```html
<Button shape="rect" width={200} height={60}>
  <Sprite image="icon.png" x={20} y={30} width={30} height={30} />
  <Text text="Custom" x={60} y={30} />
</Button>
```

When `children` are provided, they take priority over the `text` property.

## Custom Background

You can provide a custom background component:

```html
<Button 
  text="Custom Background"
  background={<Sprite image="custom-bg.png" />}
  width={150}
  height={50}
/>
```

## Complete Example

```html
<Canvas width={800} height={600}>
  <Button 
    text="Start Game"
    x={350}
    y={250}
    width={200}
    height={80}
    style={{
      backgroundColor: {
        normal: "#007bff",
        hover: "#0056b3",
        pressed: "#004085",
        disabled: "#6c757d"
      },
      border: {
        radius: 10
      },
      text: {
        fontSize: 20,
        fontFamily: "Arial Bold",
        color: "#ffffff"
      }
    }}
    click={() => {
      console.log("Starting game...");
      // Game start logic here
    }}
  />
  
  <Button 
    text="Settings"
    x={350}
    y={350}
    width={200}
    height={60}
    style={{
      backgroundColor: {
        normal: "#6c757d",
        hover: "#5a6268",
        pressed: "#545b62"
      },
      text: {
        fontSize: 16,
        color: "#ffffff"
      }
    }}
    click={() => {
      console.log("Opening settings...");
    }}
  />
  
  <!-- Circular button with controls -->
  <Button 
    text="Jump"
    shape="circle"
    x={100}
    y={100}
    width={80}
    height={80}
    controls={element.directives.controls}
    controlName="jump"
    style={{
      backgroundColor: {
        normal: "#28a745",
        hover: "#218838",
        pressed: "#1e7e34"
      }
    }}
  />
  
  <!-- Button with custom content -->
  <Button 
    shape="circle"
    x={200}
    y={100}
    width={80}
    height={80}
    style={{
      backgroundColor: {
        normal: "#ffc107",
        hover: "#e0a800",
        pressed: "#d39e00"
      }
    }}
  >
    <Sprite image="power-icon.png" width={50} height={50} />
  </Button>
</Canvas>

<script>
  import { signal, mount } from "canvasengine";
  import { Button } from "@canvasengine/core";

  const controls = signal({
    jump: {
      bind: "space",
      keyDown() {
        console.log("Jump action!");
      },
    },
  });

  mount((element) => {
    // Controls are automatically applied when buttons are clicked
  });
</script>
```

<script>
  // You can also create buttons programmatically
  const createButton = (text, onClick) => {
    return Button({
      text,
      click,
      style: {
        backgroundColor: {
          normal: "#28a745",
          hover: "#218838",
          pressed: "#1e7e34"
        }
      }
    });
  };
</script>
```

## TypeScript Types

```typescript
interface ButtonStyle {
  backgroundColor?: {
    normal?: string;
    hover?: string;
    pressed?: string;
    disabled?: string;
  };
  border?: {
    color?: string;
    width?: number;
    radius?: number;
  };
  text?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  };
  textures?: {
    normal?: string;
    hover?: string;
    pressed?: string;
    disabled?: string;
  };
}

interface ButtonProps {
  text?: string;
  disabled?: boolean;
  click?: (event: FederatedPointerEvent) => void;
  hoverEnter?: (event: FederatedPointerEvent) => void;
  hoverLeave?: (event: FederatedPointerEvent) => void;
  pressDown?: (event: FederatedPointerEvent) => void;
  pressUp?: (event: FederatedPointerEvent) => void;
  style?: ButtonStyle;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  alpha?: number;
  visible?: boolean;
  cursor?: string;
  controls?: ControlsDirective | JoystickControls;
  controlName?: string;
  shape?: 'rect' | 'circle' | 'ellipse';
  background?: Element | ComponentFunction;
  children?: Element[];
}
``` 