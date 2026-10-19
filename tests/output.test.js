import { describe, it, expect } from 'vitest'
import { assertOutputFormat, getOutputValue, valuesEqual } from '../src/core/output.js'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

describe('output helpers', () => {
  it('assertOutputFormat rejects invalid values', () => {
    expect(() => assertOutputFormat('xml')).toThrow(/Invalid outputFormat/)
    expect(() => assertOutputFormat('html')).not.toThrow()
    expect(() => assertOutputFormat('json')).not.toThrow()
  })

  it('getOutputValue returns html or json from tiptap', () => {
    const el = document.createElement('div')
    const tiptap = new Editor({
      element: el,
      extensions: [StarterKit],
      content: '<p>Test</p>',
    })
    expect(typeof getOutputValue(tiptap, 'html')).toBe('string')
    expect(getOutputValue(tiptap, 'html')).toContain('Test')
    const json = getOutputValue(tiptap, 'json')
    expect(json.type).toBe('doc')
    tiptap.destroy()
  })

  it('valuesEqual compares objects deeply', () => {
    expect(valuesEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(valuesEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(valuesEqual('x', 'x')).toBe(true)
  })
})
