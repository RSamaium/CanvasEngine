import { defineConfig } from 'tsup'

export default defineConfig({
  format: [
    'esm',
  ],
  target: 'node20',
  splitting: true,
  clean: true,
  shims: false,
  dts: true,
  sourcemap: true,
  entry: ['src/index.ts'],
  outDir: 'dist'
})
