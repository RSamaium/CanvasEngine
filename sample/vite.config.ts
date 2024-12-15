import { defineConfig } from 'vite'
import canvasengine from '../src/compiler/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [canvasengine()],
  resolve: {
    alias: {
      path: 'rollup-plugin-node-polyfills/polyfills/path',
    }
  }
});
