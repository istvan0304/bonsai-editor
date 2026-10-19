import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('letter spacing', () => {
  it('applies letter spacing to selection', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>szöveg</p>',
      toolbar: ['letterSpacing'],
    })
    editors.push(editor)

    await vi.waitFor(() => element.querySelector('[data-metric="letterSpacing"]'), {
      timeout: 3000,
    })

    editor.tiptap.chain().focus().selectAll().setLetterSpacing('0.1em').run()
    expect(editor.getHTML()).toMatch(/letter-spacing:\s*0\.1em/i)
  })
})
