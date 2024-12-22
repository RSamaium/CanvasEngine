/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
export default defineConfig(async () => {
    return {
        resolve: {
            alias: {
                'canvasengine': path.resolve(__dirname, 'packages/core/src')
            }
        },
        test: {
            environment: 'jsdom',
            pool: 'forks',
            setupFiles: ['./tests/setup/canvas.ts'],
            coverage: {
                include: [
                    'packages/**'
                ]
            }
        }
    }
})