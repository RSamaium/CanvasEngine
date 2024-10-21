/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig(async () => {
    return {
        test: {
            environment: 'jsdom',
            pool: 'forks',
            setupFiles: ['./tests/setup/canvas.ts']
        }
    }
})