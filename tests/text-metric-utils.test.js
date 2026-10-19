import { describe, it, expect } from 'vitest'
import {
  letterSpacingToNumber,
  numberToLetterSpacing,
  lineHeightToNumber,
  numberToLineHeight,
} from '../src/core/text-metric-utils.js'

describe('text metric utils', () => {
  it('converts letter spacing values', () => {
    expect(letterSpacingToNumber('0.1em')).toBe(0.1)
    expect(numberToLetterSpacing(0.05)).toBe('0.05em')
  })

  it('converts line height values', () => {
    expect(lineHeightToNumber('1.75')).toBe(1.75)
    expect(numberToLineHeight(1.5)).toBe('1.5')
  })
})
