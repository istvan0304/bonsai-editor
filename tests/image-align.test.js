import { describe, it, expect, afterEach } from 'vitest'
import { NodeSelection } from '@tiptap/pm/state'
import { BonsaiEditor } from '../src/core/editor.js'
import { applyBlockOrImageAlign } from '../src/core/image-align.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('image align', () => {
  it('stores align on image html', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p></p>',
    })
    editors.push(editor)

    editor.tiptap.chain().focus().setImage({ src: 'https://example.com/a.jpg' }).run()

    let imagePos = -1
    editor.tiptap.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && imagePos < 0) imagePos = pos
    })
    expect(imagePos).toBeGreaterThanOrEqual(0)

    const tr = editor.tiptap.state.tr.setSelection(NodeSelection.create(editor.tiptap.state.doc, imagePos))
    editor.tiptap.view.dispatch(tr)
    applyBlockOrImageAlign(editor.tiptap, 'right')

    expect(editor.getHTML()).toMatch(/data-align="right"/)
  })
})
