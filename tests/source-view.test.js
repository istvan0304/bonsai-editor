import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('SourceView', () => {
  it('toggles HTML source and applies edits', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>Hello</p>',
      toolbar: true,
    })
    editors.push(editor)

    await vi.waitFor(() => element.querySelector('.bonsai-editor__toolbar'))

    expect(editor.toggleSourceView()).toBe(true)
    expect(editor.isSourceView).toBe(true)

    const ta = element.querySelector('.bonsai-editor__source-textarea')
    expect(ta).toBeTruthy()
    ta.value = '<p>From source</p>'

    expect(editor.toggleSourceView()).toBe(true)
    expect(editor.getHTML()).toContain('From source')
    expect(editor.isSourceView).toBe(false)
  })

  it('rejects invalid JSON in json output mode', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>x</p>',
      outputFormat: 'json',
    })
    editors.push(editor)

    editor.toggleSourceView()
    const ta = element.querySelector('.bonsai-editor__source-textarea')
    ta.value = '{ invalid'

    expect(editor.toggleSourceView()).toBe(false)
    expect(editor.isSourceView).toBe(true)
  })
})
