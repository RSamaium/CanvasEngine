# Get Started

Canvas Engine is a framework for creating 2D games using a reactive programming model. It is built on top of the Canvas API and is designed to be easy to use and understand.

## Installation

```bash
npm install canvasengine
```

## Usage

1. Create a new file, for example `main.ce`:

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

2. Create a new file, for example `main.ts`:

```typescript
import { bootstrapCanvas } from "canvasengine";
import { Main } from "./main.ce";

bootstrapCanvas(document.getElementById("root"), Main());
```
