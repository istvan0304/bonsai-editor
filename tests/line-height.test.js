import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('line height', () => {
  it('applies line height to selection', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>szöveg</p>',
      toolbar: ['lineHeight'],
    })
    editors.push(editor)

    await vi.waitFor(() => element.querySelector('[data-metric="lineHeight"]'), {
      timeout: 3000,
    })

    editor.tiptap.chain().focus().selectAll().setLineHeight('1.75').run()
    expect(editor.getHTML()).toMatch(/line-height:\s*1\.75/i)
  })
})
