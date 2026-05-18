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

In development, compiled `.ce` components are wrapped with CanvasEngine HMR by
default. If you prefer Vite to reload the module/page instead of patching
component instances in place, disable it:

```ts
import { defineConfig } from 'vite';
import canvasengine from '@canvasengine/compiler';

export default defineConfig({
  plugins: [canvasengine({ hmr: false })],
});
```

For production builds, the CanvasEngine plugin automatically keeps PixiJS and
CanvasEngine runtime modules in stable chunks. If your project already defines
custom Rollup chunks, keep them as usual; CanvasEngine chunks are applied first
and your custom chunks are preserved.

```ts
import { defineConfig } from 'vite';
import canvasengine, { withCanvasEngineManualChunks } from '@canvasengine/compiler';

export default defineConfig({
  plugins: [canvasengine()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: withCanvasEngineManualChunks((id) => {
          if (id.includes('node_modules/lodash')) return 'vendor';
        }),
      },
    },
  },
});
```
