import { describe, it, expect } from 'vitest'
import {
  joinBrowsePath,
  normalizeBrowsePath,
  parentBrowsePath,
  sanitizeUserId,
} from '../src/files/path-utils.js'

describe('path utils', () => {
  it('normalizes unsafe path segments', () => {
    expect(normalizeBrowsePath('a/../b')).toBe('a/b')
    expect(normalizeBrowsePath('/images/2024/')).toBe('images/2024')
  })

  it('joins and resolves parent paths', () => {
    expect(joinBrowsePath('images', '2024')).toBe('images/2024')
    expect(parentBrowsePath('images/2024')).toBe('images')
  })

  it('sanitizes user ids for storage keys', () => {
    expect(sanitizeUserId('  alice@co  ')).toBe('aliceco')
    expect(sanitizeUserId('user-99_ok')).toBe('user-99_ok')
    expect(sanitizeUserId('')).toBe('')
  })
})
