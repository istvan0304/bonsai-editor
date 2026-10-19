import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import { FileStore, formatFileSize } from '../src/files/file-store.js'
import { LocalBrowseStore } from '../src/files/local-browse.js'
import { normalizeBrowsePath } from '../src/files/path-utils.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('file manager', () => {
  it('formatFileSize renders human readable sizes', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('local browse supports folder navigation', () => {
    const store = new LocalBrowseStore()
    store.createFolder('', 'album')
    const root = store.browse('')
    expect(root.entries.some((e) => e.kind === 'dir' && e.name === 'album')).toBe(true)

    const nested = store.browse('album')
    expect(nested.path).toBe('album')
    expect(nested.entries.some((e) => e.kind === 'parent' && e.path === '')).toBe(true)
  })

  it('local browse removes files by listing path', () => {
    const store = new LocalBrowseStore()
    const file = new File(['x'], 'note.txt', { type: 'text/plain' })
    store.addFile('', file)
    store.addFile('album', new File(['y'], 'inner.txt', { type: 'text/plain' }))
    store.createFolder('', 'album')

    const rootFile = store.browse('').entries.find((e) => e.kind === 'file' && e.name === 'note.txt')
    const nestedFile = store.browse('album').entries.find((e) => e.kind === 'file' && e.name === 'inner.txt')
    expect(rootFile).toBeTruthy()
    expect(nestedFile).toBeTruthy()

    store.removeEntry(/** @type {import('../src/files/file-upload.js').BrowseEntry} */ (rootFile))
    store.removeEntry(/** @type {import('../src/files/file-upload.js').BrowseEntry} */ (nestedFile))

    expect(store.browse('').entries.some((e) => e.kind === 'file')).toBe(false)
    expect(store.browse('album').entries.some((e) => e.kind === 'file')).toBe(false)
  })

  it('stores uploaded files in memory', () => {
    const store = new FileStore()
    const file = new File(['x'], 'test.txt', { type: 'text/plain' })
    const entry = store.add(file)
    expect(store.list()).toHaveLength(1)
    expect(entry.name).toBe('test.txt')
    store.remove(entry.id)
    expect(store.list()).toHaveLength(0)
  })

  it('normalizes initial browse path for open', () => {
    expect(normalizeBrowsePath('dokumentumok')).toBe('dokumentumok')
    expect(normalizeBrowsePath('/képek/2024/')).toBe('képek/2024')
    expect(normalizeBrowsePath('')).toBe('')
  })

  it('opens modal from toolbar button', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>x</p>',
      toolbar: ['fileManager'],
    })
    editors.push(editor)

    await vi.waitFor(
      () => {
        expect(element.querySelector('[data-action="fileManager"]')).toBeTruthy()
      },
      { timeout: 3000 },
    )

    const btn = element.querySelector('[data-action="fileManager"]')
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    const overlay = element.querySelector('.bonsai-editor__file-manager-overlay')
    expect(overlay?.hidden).toBe(false)
    expect(editor.fileManager?.isOpen).toBe(true)
    expect(element.querySelector('.bonsai-editor__file-manager-dialog--nc')).toBeTruthy()
  })
})
