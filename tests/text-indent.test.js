import { describe, it, expect, afterEach } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import { parseTextIndentLevel } from '../src/core/text-indent-extension.js'
import { getActiveTextIndentLevel } from '../src/core/text-indent-utils.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('text indent utils', () => {
  it('parses em margin levels', () => {
    expect(parseTextIndentLevel('3em', 1.5)).toBe(2)
    expect(parseTextIndentLevel('', 1.5)).toBe(0)
  })
})

describe('text indent editor', () => {
  it('increases paragraph indent', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>Bekezdés</p>',
      toolbar: ['indentIncrease', 'indentDecrease'],
    })
    editors.push(editor)

    editor.tiptap.chain().focus('end').increaseTextIndent().run()
    expect(getActiveTextIndentLevel(editor.tiptap)).toBe(1)
    expect(editor.getHTML()).toMatch(/margin-left:\s*1\.5em/i)

    editor.tiptap.chain().focus().decreaseTextIndent().run()
    expect(getActiveTextIndentLevel(editor.tiptap)).toBe(0)
  })
})
