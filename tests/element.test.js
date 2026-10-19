import { describe, it, expect, afterEach } from 'vitest'
import { defineBonsaiElement } from '../src/element/bonsai-editor-element.js'

const TAG = 'bonsai-editor-test'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('bonsai-editor element', () => {
  it('registers and exposes editor on ready', async () => {
    defineBonsaiElement(TAG)
    const el = document.createElement(TAG)
    document.body.appendChild(el)

    await customElements.whenDefined(TAG)
    await Promise.resolve()

    expect(el.editor).toBeTruthy()
    expect(typeof el.value).toBe('string')
  })

  it('emits bonsai-update on content change', async () => {
    defineBonsaiElement(TAG)
    const el = document.createElement(TAG)
    el.setAttribute('value', '<p>Start</p>')
    document.body.appendChild(el)
    await customElements.whenDefined(TAG)
    await Promise.resolve()

    /** @type {unknown[]} */
    const values = []
    el.addEventListener('bonsai-update', (e) => {
      values.push(/** @type {CustomEvent} */ (e).detail.value)
    })

    el.editor?.setContent('<p>Updated</p>', { emitUpdate: true })
    expect(values.length).toBeGreaterThan(0)
  })

  it('reads initial value attribute as html', async () => {
    defineBonsaiElement(TAG)
    const el = document.createElement(TAG)
    el.setAttribute('value', '<p>Form</p>')
    document.body.appendChild(el)
    await customElements.whenDefined(TAG)
    await Promise.resolve()

    expect(String(el.value)).toContain('Form')
  })

  it('cleans up on disconnect', async () => {
    defineBonsaiElement(TAG)
    const el = document.createElement(TAG)
    document.body.appendChild(el)
    await customElements.whenDefined(TAG)
    await Promise.resolve()
    const instance = el.editor
    el.remove()
    expect(instance?.isDestroyed).toBe(true)
  })
})
