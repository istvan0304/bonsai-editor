import { describe, it, expect } from 'vitest'
import { resolveMenubarMenus } from '../src/menubar/menubar-config.js'

describe('menubar config', () => {
  it('returns null when disabled', () => {
    expect(resolveMenubarMenus(false)).toBeNull()
  })

  it('enables all menus for true', () => {
    const set = resolveMenubarMenus(true)
    expect(set?.has('file')).toBe(true)
    expect(set?.has('format')).toBe(true)
  })

  it('supports whitelist', () => {
    const set = resolveMenubarMenus(['file', 'view'])
    expect(set?.has('file')).toBe(true)
    expect(set?.has('edit')).toBe(false)
  })

  it('supports opt-out object', () => {
    const set = resolveMenubarMenus({ format: false })
    expect(set?.has('edit')).toBe(true)
    expect(set?.has('format')).toBe(false)
  })
})
