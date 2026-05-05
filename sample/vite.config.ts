import { defineConfig } from 'vite'
import canvasengine, { shaderLoader } from '../packages/compiler'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [canvasengine(), shaderLoader()],
  resolve: {
    alias: {
      canvasengine: path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@canvasengine/presets': path.resolve(__dirname, '../packages/presets/src/index.ts'),
      '@chenglou/pretext': path.resolve(__dirname, '../packages/core/node_modules/@chenglou/pretext/dist/layout.js'),
      path: 'path-browserify',
      '@canvasengine/testing': path.resolve(__dirname, '../packages/testing/src/index.ts'),
    }
  }
});
