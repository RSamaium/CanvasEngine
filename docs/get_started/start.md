# Start with CanvasEngine

## 1. Add div with id `root` to your HTML

In your `index.html` file, add a `div` with the id `root`:

```html
<div id="root"></div>
```

## 2. Create a Canvas Component

Create a new file `app.ce` in your project root: 

```html
<Canvas>
  <Text text="Hello World" />
</Canvas>
```

::: warning
The start file must always begin with the `<Canvas>` tag.
:::

## 3. Add the `bootstrapCanvas` function to your entry file

```ts
import App from './app.ce';
import { bootstrapCanvas } from 'canvasengine';

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
```

## 4. Run your project

Run your project with the following command:

```bash
npm run dev
```
