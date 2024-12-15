import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['esm'],
  target: 'es2020',
  splitting: true,
  clean: true,
  shims: false,
  dts: true,
  sourcemap: true,
  entry: ['src/index.ts'],
  outDir: 'dist'
})
