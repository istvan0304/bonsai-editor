import { describe, it, expect } from 'vitest'
import { sortBrowseFileEntries } from '../src/files/sort-entries.js'

describe('sortBrowseFileEntries', () => {
  const files = [
    { kind: 'file', name: 'b.txt', path: 'b.txt', type: 'text/plain', size: 100 },
    { kind: 'file', name: 'a.png', path: 'a.png', type: 'image/png', size: 50 },
    { kind: 'file', name: 'c.pdf', path: 'c.pdf', type: 'application/pdf', size: 200 },
  ]

  it('sorts by name ascending', () => {
    const sorted = sortBrowseFileEntries(files, 'name', 'asc')
    expect(sorted.map((f) => f.name)).toEqual(['a.png', 'b.txt', 'c.pdf'])
  })

  it('sorts by size descending', () => {
    const sorted = sortBrowseFileEntries(files, 'size', 'desc')
    expect(sorted.map((f) => f.name)).toEqual(['c.pdf', 'b.txt', 'a.png'])
  })

  it('sorts by type', () => {
    const sorted = sortBrowseFileEntries(files, 'type', 'asc')
    expect(sorted[0].name).toBe('c.pdf')
    expect(sorted[1].name).toBe('a.png')
  })
})
