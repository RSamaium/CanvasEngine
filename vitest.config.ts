/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
export default defineConfig(async () => {
    return {
        resolve: {
            alias: [
                { find: /^canvasengine$/, replacement: path.resolve(__dirname, 'packages/core/src') },
                { find: /^pixi-viewport$/, replacement: path.resolve(__dirname, 'packages/core/node_modules/pixi-viewport') },
                // @pixi/3d is a dependency of packages/3d only
                { find: /^@pixi\/3d\/extras$/, replacement: path.resolve(__dirname, 'packages/3d/node_modules/@pixi/3d/dist/extras/index.mjs') },
                { find: /^@pixi\/3d$/, replacement: path.resolve(__dirname, 'packages/3d/node_modules/@pixi/3d/dist/index.mjs') },
            ]
        },
        test: {
            environment: 'jsdom',
            pool: 'forks',
            setupFiles: ['./tests/setup/canvas.ts'],
            exclude: [
                '**/sample/**',
                '**/tests/visual/**',
                '**/node_modules/**',
                // Worktrees of other sessions: their tests would run against this checkout
                '**/.claude/**'
            ],
            coverage: {
                include: [
                    'packages/**'
                ]
            }
        }
    }
})
