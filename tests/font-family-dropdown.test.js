import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import { DEFAULT_FONT_FAMILIES } from '../src/core/font-families.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('Font family dropdown', () => {
  it('renders in the default toolbar and applies font family', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>szöveg</p>',
      toolbar: true,
    })
    editors.push(editor)

    await vi.waitFor(() => {
      expect(element.querySelector('.bonsai-editor__font-select')).toBeTruthy()
    })

    const fontSelect = element.querySelector('.bonsai-editor__font-select')
    const options = fontSelect?.querySelectorAll('.bonsai-editor__font-option')
    expect(options?.length).toBe(DEFAULT_FONT_FAMILIES.length)

    editor.tiptap.chain().focus().selectAll().setFontFamily('Arial, Helvetica, sans-serif').run()

    expect(editor.getHTML()).toMatch(/font-family:\s*Arial/i)
  })
})
