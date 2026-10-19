/**
 * @typedef {'name' | 'size' | 'type'} FileSortKey
 * @typedef {'asc' | 'desc'} SortDirection
 */

/**
 * @param {import('./file-upload.js').BrowseEntry} entry
 * @param {FileSortKey} key
 */
function sortValue(entry, key) {
  if (key === 'size') return entry.size ?? 0
  if (key === 'type') return (entry.type || '').toLowerCase()
  return entry.name.toLocaleLowerCase('hu')
}

/**
 * @param {import('./file-upload.js').BrowseEntry[]} entries
 * @param {FileSortKey} key
 * @param {SortDirection} direction
 * @param {string} [locale]
 */
export function sortBrowseFileEntries(entries, key, direction, locale = 'hu') {
  const factor = direction === 'asc' ? 1 : -1
  return [...entries].sort((a, b) => {
    if (key === 'name') {
      return factor * a.name.localeCompare(b.name, locale, { sensitivity: 'base' })
    }
    if (key === 'type') {
      const left = a.type || ''
      const right = b.type || ''
      return factor * left.localeCompare(right, locale, { sensitivity: 'base' })
    }
    const left = sortValue(a, 'size')
    const right = sortValue(b, 'size')
    if (left === right) {
      return a.name.localeCompare(b.name, locale, { sensitivity: 'base' })
    }
    return factor * (left - right)
  })
}

/**
 * @param {FileSortKey} key
 * @param {SortDirection} direction
 */
export function fileSortIndicator(key, direction) {
  if (direction === 'asc') return ' ↑'
  return ' ↓'
}
