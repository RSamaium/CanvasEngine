import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['esm', 'iife'],
  target: 'es2020',
  splitting: true,
  clean: true,
  shims: false,
  minify: true,
  dts: true,
  sourcemap: true,
  entry: ['src/index.ts'],
  outDir: 'dist',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  globalName: 'CanvasEngine'
}) 