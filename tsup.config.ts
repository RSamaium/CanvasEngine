import { defineConfig } from 'tsup'

export default [
  defineConfig({
    format: ['esm'],
    target: 'es2020',
    splitting: true,
    clean: true,
    shims: false,
    dts: true,
    sourcemap: true,
    entry: ['src/index.ts'],
    outDir: 'dist'
  }),
  
  defineConfig({
    format: ['esm'],
    target: 'node20',
    splitting: true,
    clean: false,
    shims: false,
    dts: true,
    sourcemap: true,
    entry: ['src/compiler/vite.ts'],
    outDir: 'dist/compiler',
    external: ['vite', 'acorn', 'peggy', 'typescript'],
  })
]
