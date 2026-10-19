import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import { applyFormatToEditor, readFormatFromEditor } from '../src/core/format-painter.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('format painter', () => {
  it('copies bold mark and applies to plain text selection', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p><strong>forrás</strong></p><p>cél</p>',
    })
    editors.push(editor)

    await vi.waitFor(() => editor.tiptap, { timeout: 2000 })

    editor.tiptap.chain().focus().setTextSelection({ from: 1, to: 7 }).run()
    const format = readFormatFromEditor(editor.tiptap)
    expect(format.marks.bold).toBe(true)

    editor.tiptap.chain().focus().setTextSelection({ from: 9, to: 12 }).run()
    applyFormatToEditor(editor.tiptap, format)

    expect(editor.getHTML()).toContain('<strong>cél</strong>')
  })

  it('applies copied format when armed and target is selected', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p><em>forrás</em></p><p>cel</p>',
    })
    editors.push(editor)

    await vi.waitFor(() => editor.tiptap, { timeout: 2000 })

    editor.tiptap.chain().focus().setTextSelection({ from: 1, to: 7 }).run()
    editor.formatPainter.copyAndArm()

    editor.tiptap.chain().focus().setTextSelection({ from: 9, to: 12 }).run()

    expect(editor.formatPainter.isArmed).toBe(false)
    expect(editor.getHTML()).toContain('<em>cel</em>')
  })
})
