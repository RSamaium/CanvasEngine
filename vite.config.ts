import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      path: 'rollup-plugin-node-polyfills/polyfills/path',
    }
  }
});
