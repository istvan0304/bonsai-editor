import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { convertDocxArrayBufferToHtml } from '../src/core/word-import.js'

describe('word import integration', () => {
  it('converts a real docx fixture', async () => {
    const path = resolve(
      'node_modules/mammoth/test/test-data/single-paragraph.docx',
    )
    const buf = readFileSync(path)
    const arrayBuffer = new Uint8Array(buf).buffer
    const result = await convertDocxArrayBufferToHtml(arrayBuffer)
    expect(result.html.length).toBeGreaterThan(0)
    expect(result.html).not.toBe('<p></p>')
  })
})
