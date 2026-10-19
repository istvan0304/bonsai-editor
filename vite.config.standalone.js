import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    target: 'es2020',
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/standalone.js'),
      name: 'BonsaiEditor',
      formats: ['iife', 'es'],
      fileName: (format) =>
        format === 'iife' ? 'bonsai-editor.standalone.iife.js' : 'bonsai-editor.standalone.js',
    },
  },
})
