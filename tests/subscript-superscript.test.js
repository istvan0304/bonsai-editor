import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('subscript and superscript', () => {
  it('toggles sub and sup marks in HTML output', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>H2O</p>',
      toolbar: ['subscript', 'superscript'],
    })
    editors.push(editor)

    await vi.waitFor(() => element.querySelector('[data-action="subscript"]'), { timeout: 2000 })

    editor.tiptap.chain().focus().setTextSelection({ from: 2, to: 3 }).run()
    editor.tiptap.chain().focus().toggleSubscript().run()
    expect(editor.getHTML()).toContain('<sub>2</sub>')

    editor.tiptap.chain().focus().setTextSelection({ from: 3, to: 4 }).run()
    editor.tiptap.chain().focus().unsetMark('subscript').toggleSuperscript().run()
    expect(editor.getHTML()).toContain('<sup>O</sup>')
  })
})
