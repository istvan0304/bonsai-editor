import { build } from 'vite'
import { resolve } from 'node:path'
import { rmSync } from 'node:fs'

const root = import.meta.dirname + '/..'

/** @param {string} entry @param {string} fileName @param {boolean} emptyOutDir */
async function buildEntry(entry, fileName, emptyOutDir) {
  await build({
    configFile: false,
    build: {
      target: 'es2020',
      emptyOutDir,
      outDir: resolve(root, 'dist'),
      lib: {
        entry: resolve(root, entry),
        formats: ['es', 'cjs'],
        fileName: (format) => (format === 'es' ? `${fileName}.js` : `${fileName}.cjs`),
        cssFileName: fileName === 'bonsai-editor' ? 'bonsai-editor' : undefined,
      },
      rollupOptions: {
        external: [/^@tiptap\//, 'vue'],
        output: {
          codeSplitting: false,
        },
      },
    },
  })
}

rmSync(resolve(root, 'dist'), { recursive: true, force: true })

await buildEntry('src/index.js', 'bonsai-editor', true)
await buildEntry('src/element.js', 'element', false)
await buildEntry('src/wrappers/vue/index.js', 'vue', false)
