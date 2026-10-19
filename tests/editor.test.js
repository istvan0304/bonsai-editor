import { describe, it, expect, afterEach } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

function createEditor(options = {}) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  const editor = new BonsaiEditor({
    element,
    content: '<p>Hello</p>',
    ...options,
  })
  editors.push(editor)
  return editor
}

describe('BonsaiEditor', () => {
  it('returns HTML by default', () => {
    const editor = createEditor()
    expect(typeof editor.getValue()).toBe('string')
    expect(editor.getHTML()).toContain('Hello')
  })

  it('supports JSON output format', () => {
    const editor = createEditor({ outputFormat: 'json' })
    const value = editor.getValue()
    expect(typeof value).toBe('object')
    expect(value.type).toBe('doc')
  })

  it('setContent without emitUpdate does not fire onUpdate', () => {
    let count = 0
    const editor = createEditor({
      onUpdate: () => {
        count += 1
      },
    })
    editor.setContent('<p>Other</p>', { emitUpdate: false })
    expect(count).toBe(0)
    expect(editor.getHTML()).toContain('Other')
  })

  it('destroy is idempotent', () => {
    const editor = createEditor()
    editor.destroy()
    editor.destroy()
    expect(editor.isDestroyed).toBe(true)
  })

  it('throws on invalid outputFormat', () => {
    expect(() => createEditor({ outputFormat: 'xml' })).toThrow(/Invalid outputFormat/)
  })

  it('isEmpty detects empty document', () => {
    const editor = createEditor({ content: '' })
    expect(editor.isEmpty()).toBe(true)
  })
})
