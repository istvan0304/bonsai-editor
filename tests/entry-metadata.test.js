import { describe, it, expect } from 'vitest'
import { buildBrowseEntryMetadataRows, formatMetadataTimestamp } from '../src/files/entry-metadata.js'

describe('browse entry metadata', () => {
  it('builds file metadata rows', () => {
    const rows = buildBrowseEntryMetadataRows({
      kind: 'file',
      name: 'photo.png',
      path: 'images/photo.png',
      type: 'image/png',
      size: 2048,
      url: '/raw/images/photo.png',
      uploadedAt: Date.UTC(2024, 5, 1, 12, 30),
    })

    expect(rows.some((r) => r.label === 'Név' && r.value === 'photo.png')).toBe(true)
    expect(rows.some((r) => r.label === 'MIME' && r.value === 'image/png')).toBe(true)
    expect(rows.some((r) => r.label === 'URL' && r.href === '/raw/images/photo.png')).toBe(true)
    expect(rows.find((r) => r.label === 'Típus')?.value).toBe('Képfájl')
  })

  it('builds folder metadata rows', () => {
    const rows = buildBrowseEntryMetadataRows({
      kind: 'dir',
      name: 'docs',
      path: 'docs',
    })
    expect(rows.find((r) => r.label === 'Típus')?.value).toBe('Mappa')
  })

  it('formats timestamps', () => {
    expect(formatMetadataTimestamp(undefined)).toBe('—')
    expect(formatMetadataTimestamp(0)).toMatch(/1970/)
  })
})
