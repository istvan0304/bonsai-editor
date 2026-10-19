import { describe, it, expect } from 'vitest'
import { isAllowedLinkUrl } from '../src/core/extensions.js'

describe('link protocol filter', () => {
  it('allows safe protocols', () => {
    expect(isAllowedLinkUrl('https://example.com')).toBe(true)
    expect(isAllowedLinkUrl('http://example.com/path')).toBe(true)
    expect(isAllowedLinkUrl('mailto:user@example.com')).toBe(true)
    expect(isAllowedLinkUrl('tel:+3612345678')).toBe(true)
  })

  it('blocks javascript URLs', () => {
    expect(isAllowedLinkUrl('javascript:alert(1)')).toBe(false)
  })

  it('blocks invalid URLs', () => {
    expect(isAllowedLinkUrl('not a url')).toBe(false)
  })
})
