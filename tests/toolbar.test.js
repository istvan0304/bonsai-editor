import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('BonsaiToolbar', () => {
  it('renders icon buttons without visible text labels', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>x</p>',
      toolbar: true,
    })
    editors.push(editor)

    await vi.waitFor(
      () => {
        expect(element.querySelectorAll('.bonsai-editor__toolbar button').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    const buttons = element.querySelectorAll('.bonsai-editor__toolbar > button')
    expect(buttons.length).toBeGreaterThan(0)
    for (const btn of buttons) {
      expect(btn.querySelector('svg')).toBeTruthy()
      expect(btn.textContent?.trim()).toBe('')
    }
  })
})
