import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import { cssColorToHex, normalizeHexColor } from '../src/core/text-color-utils.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('text color utils', () => {
  it('normalizes hex colors', () => {
    expect(normalizeHexColor('#AABBCC')).toBe('#aabbcc')
    expect(cssColorToHex('rgb(255, 0, 0)')).toBe('#ff0000')
  })
})

describe('text color toolbar', () => {
  it('applies text and background colors', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>szín</p>',
      toolbar: ['textColor', 'textBackground'],
    })
    editors.push(editor)

    await vi.waitFor(() => element.querySelector('[data-color-kind="textColor"]'), {
      timeout: 3000,
    })

    editor.tiptap.chain().focus().selectAll().setColor('#2563eb').run()
    expect(editor.getHTML()).toMatch(/color:\s*(#2563eb|rgb\(37,\s*99,\s*235\))/i)

    editor.tiptap.chain().focus().selectAll().setBackgroundColor('#fef08a').run()
    expect(editor.getHTML()).toMatch(
      /background-color:\s*(#fef08a|rgb\(254,\s*240,\s*138\))/i,
    )
  })
})
