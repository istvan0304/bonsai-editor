import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { demoUploadsPlugin } from './scripts/vite-demo-uploads-plugin.mjs'

const root = resolve(import.meta.dirname)

export default defineConfig({
  plugins: [demoUploadsPlugin()],
  root: resolve(root, 'demo'),
  server: {
    port: 4173,
    open: true,
    watch: {
      ignored: ['**/dist/**', '**/node_modules/**', '**/.demo-uploads/**'],
    },
  },
  resolve: {
    alias: [
      { find: 'bonsai-editor/style.css', replacement: resolve(root, 'src/core/theme.css') },
      { find: 'bonsai-editor/element', replacement: resolve(root, 'src/element.js') },
      { find: 'bonsai-editor', replacement: resolve(root, 'src/index.js') },
      {
        find: 'mammoth/mammoth.browser.js',
        replacement: resolve(root, 'node_modules/mammoth/mammoth.browser.js'),
      },
    ],
  },
  optimizeDeps: {
    include: ['mammoth/mammoth.browser.js'],
  },
})
