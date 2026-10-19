import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('text align', () => {
  it('sets center alignment on paragraph', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>Igazítás</p>',
      toolbar: ['alignCenter'],
    })
    editors.push(editor)

    await vi.waitFor(() => editor.tiptap, { timeout: 2000 })

    editor.tiptap.chain().focus().selectAll().setTextAlign('center').run()
    expect(editor.getHTML()).toMatch(/text-align:\s*center|style="[^"]*center/)
  })
})
