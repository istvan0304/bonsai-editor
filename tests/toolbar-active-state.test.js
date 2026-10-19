import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('toolbar active state', () => {
  it('shows bold as pressed with collapsed selection (stored marks)', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>szöveg</p>',
      toolbar: ['bold'],
    })
    editors.push(editor)

    await vi.waitFor(
      () => {
        expect(element.querySelector('[data-action="bold"]')).toBeTruthy()
      },
      { timeout: 2000 },
    )
    const boldBtn = /** @type {HTMLButtonElement} */ (
      element.querySelector('[data-action="bold"]')
    )

    editor.tiptap.chain().focus('end').toggleBold().run()

    await vi.waitFor(
      () => {
        expect(boldBtn.getAttribute('aria-pressed')).toBe('true')
        expect(boldBtn.classList.contains('is-active')).toBe(true)
      },
      { timeout: 2000 },
    )
  })
})
