import { describe, it, expect } from 'vitest'
import { filterBrowseFilesByName } from '../src/files/filter-entries.js'

describe('filterBrowseFilesByName', () => {
  const files = [
    { kind: 'file', name: 'Report.pdf', path: 'Report.pdf' },
    { kind: 'file', name: 'photo.PNG', path: 'photo.PNG' },
    { kind: 'file', name: 'notes.txt', path: 'notes.txt' },
  ]

  it('returns all entries when query is empty', () => {
    expect(filterBrowseFilesByName(files, '')).toHaveLength(3)
    expect(filterBrowseFilesByName(files, '   ')).toHaveLength(3)
  })

  it('matches substring case-insensitively', () => {
    expect(filterBrowseFilesByName(files, 'rep').map((f) => f.name)).toEqual(['Report.pdf'])
    expect(filterBrowseFilesByName(files, 'png').map((f) => f.name)).toEqual(['photo.PNG'])
  })
})
