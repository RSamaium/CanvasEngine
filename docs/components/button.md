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
</Canvas>

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
}
``` 