import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('table insert', () => {
  it('inserts a table with header row', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p></p>',
      toolbar: ['insertTable'],
    })
    editors.push(editor)

    await vi.waitFor(() => element.querySelector('.bonsai-editor__table-control'), {
      timeout: 3000,
    })

    editor.tiptap
      .chain()
      .focus()
      .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
      .run()

    const html = editor.getHTML()
    expect(html).toMatch(/<table[\s>]/i)
    expect(html).toMatch(/<th[\s>]/i)
    expect(html).toMatch(/<td[\s>]/i)
  })
})
