/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
export default defineConfig(async () => {
    return {
        resolve: {
            alias: {
                'canvasengine': path.resolve(__dirname, 'packages/core/src'),
                'pixi-viewport': path.resolve(__dirname, 'packages/core/node_modules/pixi-viewport')
            }
        },
        test: {
            environment: 'jsdom',
            pool: 'forks',
            setupFiles: ['./tests/setup/canvas.ts'],
            exclude: [
                '**/sample/**',
                '**/node_modules/**'
            ],
            coverage: {
                include: [
                    'packages/**'
                ]
            }
        }
    }
})
