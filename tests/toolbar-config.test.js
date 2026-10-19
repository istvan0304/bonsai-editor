import { describe, it, expect } from 'vitest'
import { resolveToolbarItems, buildToolbarMountPlan } from '../src/toolbar/toolbar-config.js'

describe('toolbar config', () => {
  it('returns null when toolbar disabled', () => {
    expect(resolveToolbarItems(false)).toBeNull()
  })

  it('enables all items for toolbar true', () => {
    const set = resolveToolbarItems(true)
    expect(set?.has('bold')).toBe(true)
    expect(set?.has('fullscreen')).toBe(true)
  })

  it('supports whitelist array', () => {
    const set = resolveToolbarItems(['bold', 'link'])
    expect(set?.has('bold')).toBe(true)
    expect(set?.has('link')).toBe(true)
    expect(set?.has('italic')).toBe(false)
  })

  it('supports opt-out object', () => {
    const set = resolveToolbarItems({ link: false, fullscreen: false })
    expect(set?.has('bold')).toBe(true)
    expect(set?.has('link')).toBe(false)
  })

  it('builds mount plan without orphan separators', () => {
    const set = resolveToolbarItems(['bold', 'fullscreen'])
    const plan = buildToolbarMountPlan(set)
    expect(plan.filter((p) => p.kind === 'sep')).toHaveLength(1)
    expect(plan.filter((p) => p.kind === 'button')).toHaveLength(2)
  })
})
