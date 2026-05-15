# Get Started

CanvasEngine is a reactive 2D game framework built on PixiJS, Vite, and `.ce` components.

Start here if you are new to the project:

- [Installation](/get_started/installation)
- [Start with CanvasEngine](/get_started/start)
- [Template Syntax](/concepts/template-syntax)
- [Reactivity](/concepts/reactive)

## First component

Every CanvasEngine app starts with a root `Canvas` component:

```html
<Canvas 
  backgroundColor="white" 
  flexDirection="column" 
  justifyContent="center" 
  alignItems="center" 
  width="100%" 
  height="100%"
>
  <Text text="Hello World" />
</Canvas>
```

Then bootstrap it from your Vite entry file:

```typescript
import { bootstrapCanvas } from "canvasengine";
import Main from "./main.ce";

bootstrapCanvas(document.getElementById("root"), Main);
```
