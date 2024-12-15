import { defineConfig } from 'vite'
import canvasengine from '@canvasengine/compiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [canvasengine()]
});
