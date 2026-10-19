import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import { getHeadingLevels } from '../src/toolbar/heading-levels.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('Heading dropdown', () => {
  it('exposes six heading levels by default', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>x</p>',
      toolbar: true,
    })
    editors.push(editor)

    await vi.waitFor(() => {
      expect(element.querySelector('.bonsai-editor__heading-select')).toBeTruthy()
    })

    expect(getHeadingLevels(editor)).toEqual([1, 2, 3, 4, 5, 6])

    const options = element.querySelectorAll('.bonsai-editor__heading-option')
    expect(options.length).toBe(7)
  })
})
