import { describe, it, expect, afterEach, vi } from 'vitest'

vi.mock('../src/core/mammoth-browser.js', () => ({
  default: {
    convertToHtml: vi.fn().mockResolvedValue({
      value: '<p><strong>Word</strong> szöveg</p>',
      messages: [],
    }),
    images: {
      dataUri: {},
    },
  },
}))

import { BonsaiEditor } from '../src/core/editor.js'
import {
  convertDocxFileToHtml,
  isDocxFile,
  normalizeWordHtml,
} from '../src/core/word-import.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('word import utils', () => {
  it('detects docx files', () => {
    expect(
      isDocxFile(
        new File(['x'], 'doc.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      ),
    ).toBe(true)
    expect(isDocxFile(new File(['x'], 'doc.txt', { type: 'text/plain' }))).toBe(false)
  })

  it('normalizes empty html', () => {
    expect(normalizeWordHtml('')).toBe('<p></p>')
    expect(normalizeWordHtml('<p>A</p>')).toBe('<p>A</p>')
  })
})

describe('word import conversion', () => {
  it('converts docx via mammoth', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'teszt.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const result = await convertDocxFileToHtml(file)
    expect(result.html).toContain('<strong>Word</strong>')
    expect(result.messages).toEqual([])
  })
})

describe('editor importWord', () => {
  it('loads converted html into the editor', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p></p>',
    })
    editors.push(editor)

    const file = new File([new Uint8Array([1])], 'a.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    await editor.importWord(file, { confirmReplace: false })
    expect(editor.getHTML()).toMatch(/<strong>Word<\/strong>/)
  })

  it('inserts at cursor when mode is insert', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>Eredeti</p>',
    })
    editors.push(editor)

    const file = new File([new Uint8Array([1])], 'a.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    editor.tiptap.chain().focus('end').run()
    await editor.importWord(file, { mode: 'insert', confirmReplace: false })
    expect(editor.getHTML()).toMatch(/Eredeti/)
    expect(editor.getHTML()).toMatch(/<strong>Word<\/strong>/)
  })
})
