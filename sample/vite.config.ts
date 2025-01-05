import { defineConfig } from 'vite'
import canvasengine from '../packages/compiler'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [canvasengine()],
  resolve: {
    alias: {
      canvasengine: path.resolve(dirname, '../packages/core/src/index.ts'),
      '@canvasengine/presets': path.resolve(dirname, '../packages/presets/src/index.ts'),
      path: 'path-browserify',
    }
  }
});
