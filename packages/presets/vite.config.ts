import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasEnginePresets'
    },
    rollupOptions: {
      external: ['canvasengine', 'pixi.js'],
      output: [
        // ESM build with externals
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: 'index.js'
        },
        // IIFE build that extends global CanvasEngine
        {
          format: 'iife',
          dir: 'dist',
          entryFileNames: 'index.global.js',
          name: 'CanvasEnginePresets',
          globals: {
            'canvasengine': 'CanvasEngine',
            'pixi.js': 'PIXI'
          },
        }
      ]
    },
    minify: true,
    sourcemap: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
}) 