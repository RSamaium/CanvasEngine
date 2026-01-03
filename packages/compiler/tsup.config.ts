import { defineConfig } from 'tsup'
import { copyFileSync } from 'fs'
import { join } from 'path'

export default  defineConfig({
    format: ['esm'],
    target: 'node20',
    splitting: true,
    clean: true,
    shims: false,
    dts: true,
    sourcemap: true,
    entry: ['index.ts'],
    outDir: 'dist',
    external: ['vite', 'acorn', 'peggy', 'typescript'],
    onSuccess: async () => {
        // Copy grammar.pegjs to dist directory
        copyFileSync(
            join(process.cwd(), 'grammar.pegjs'),
            join(process.cwd(), 'dist', 'grammar.pegjs')
        )
        copyFileSync(
            join(process.cwd(), 'grammar2.pegjs'),
            join(process.cwd(), 'dist', 'grammar2.pegjs')
        )
    },
})
