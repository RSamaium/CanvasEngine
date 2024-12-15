import { defineConfig } from 'vite'
import canvasengine from '../compiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [canvasengine()],
  resolve: {
    alias: {
      path: 'rollup-plugin-node-polyfills/polyfills/path',
    }
  }
});
