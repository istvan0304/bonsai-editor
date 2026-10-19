import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(import.meta.dirname, 'playground'),
  server: {
    open: true,
  },
  resolve: {
    alias: [
      {
        find: 'bonsai-editor/style.css',
        replacement: resolve(import.meta.dirname, 'src/core/theme.css'),
      },
      { find: 'bonsai-editor/element', replacement: resolve(import.meta.dirname, 'src/element.js') },
      { find: 'bonsai-editor', replacement: resolve(import.meta.dirname, 'src/index.js') },
      {
        find: 'mammoth/mammoth.browser.js',
        replacement: resolve(import.meta.dirname, 'node_modules/mammoth/mammoth.browser.js'),
      },
    ],
  },
  optimizeDeps: {
    include: ['mammoth/mammoth.browser.js'],
  },
})
