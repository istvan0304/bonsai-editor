import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('menubar', () => {
  it('renders menubar when enabled', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>Test</p>',
      menubar: true,
    })
    editors.push(editor)

    await vi.waitFor(
      () => {
        expect(element.querySelector('.bonsai-editor__menubar')).toBeTruthy()
      },
      { timeout: 2000 },
    )

    const triggers = element.querySelectorAll('.bonsai-editor__menubar-trigger')
    expect(triggers.length).toBe(4)
    expect([...triggers].map((t) => t.textContent)).toEqual([
      'Fájl',
      'Szerkesztés',
      'Nézet',
      'Formázás',
    ])

  })

  it('omits menubar when disabled', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>Test</p>',
      menubar: false,
    })
    editors.push(editor)

    await vi.waitFor(() => editor.tiptap, { timeout: 2000 })
    expect(element.querySelector('.bonsai-editor__menubar')).toBeNull()
  })
})
