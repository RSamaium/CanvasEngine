# Installation

## From template

```bash
npx degit RSamaium/CanvasEngine/starter my-project
cd my-project
npm install
npm run dev # and go to localhost:5173
```

## In existing project

> Your project must already be under Vite.

```bash
npm i canvasengine @canvasengine/compiler
```

Add in `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import canvasengine from '@canvasengine/compiler';

export default defineConfig({
  plugins: [canvasengine()],
});
```
