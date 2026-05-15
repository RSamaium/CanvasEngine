# Start with CanvasEngine

This guide creates the smallest useful CanvasEngine app: one root DOM node, one `.ce` component, and one TypeScript entry file.

## 1. Add the root element

In `index.html`, add a `div` with the id `root`:

```html
<div id="root"></div>
```

## 2. Create a Canvas component

Create `app.ce`:

```html
<Canvas backgroundColor="#101820">
  <Text
    text="Hello CanvasEngine"
    x={40}
    y={40}
    size={32}
    color="#ffffff"
  />
</Canvas>
```

::: warning
The start component passed to `bootstrapCanvas` must begin with the `<Canvas>` tag.
:::

## 3. Bootstrap the app

In your Vite entry file, for example `main.ts`, import the component and call `bootstrapCanvas`:

```ts
import App from './app.ce';
import { bootstrapCanvas } from 'canvasengine';

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
```

## 4. Run the dev server

Run:

```bash
npm run dev
```

You should see a dark canvas with `Hello CanvasEngine` rendered near the top-left corner.
