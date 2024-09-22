import { defineConfig } from 'vite'
import vitePluginCe from './src/compiler/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vitePluginCe()],
  resolve: {
    alias: {
      path: 'rollup-plugin-node-polyfills/polyfills/path',
    }
  }
});
