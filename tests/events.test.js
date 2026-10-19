import { describe, it, expect, afterEach } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('BonsaiEditor events', () => {
  it('on/off update uses outputFormat', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const updates = []
    const editor = new BonsaiEditor({
      element,
      content: '<p>A</p>',
      outputFormat: 'json',
      onUpdate: (v) => updates.push(v),
    })
    editors.push(editor)

    editor.on('update', (v) => updates.push(v))
    editor.setContent('<p>B</p>', { emitUpdate: true })
    expect(updates.length).toBeGreaterThanOrEqual(2)
    expect(typeof updates[updates.length - 1]).toBe('object')

    const handler = () => {}
    editor.on('create', handler)
    editor.off('create', handler)
  })

  it('outputFormat setter validates input', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({ element })
    editors.push(editor)
    editor.outputFormat = 'json'
    expect(editor.getValue().type).toBe('doc')
    expect(() => {
      editor.outputFormat = 'xml'
    }).toThrow(/Invalid outputFormat/)
  })

  it('getJSON returns a deep copy', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({ element, content: '<p>X</p>' })
    editors.push(editor)
    const json = editor.getJSON()
    json.type = 'mutated'
    expect(editor.getJSON().type).toBe('doc')
  })
})
