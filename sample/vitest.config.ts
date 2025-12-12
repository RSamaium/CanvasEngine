/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      'canvasengine': path.resolve(__dirname, '../packages/core/src'),
      '@canvasengine/testing': path.resolve(__dirname, '../packages/testing/src'),
      '@canvasengine/presets': path.resolve(__dirname, '../packages/presets/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.spec.ts'],
  },
});
