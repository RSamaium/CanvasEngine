import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasEngine'
    },
    rollupOptions: {
      external: ['pixi.js'],
      output: [
        // ESM build
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: 'index.js'
        },
        // IIFE build for global usage
        {
          format: 'iife',
          dir: 'dist',
          entryFileNames: 'index.global.js',
          name: 'CanvasEngine',
          globals: {
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