import { defineConfig } from 'vite'
import vitePluginCe from 'canvasengine/compiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vitePluginCe()],
  resolve: {
    alias: {
      path: 'rollup-plugin-node-polyfills/polyfills/path',
    }
  }
});
