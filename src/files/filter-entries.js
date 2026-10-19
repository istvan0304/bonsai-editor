/**
 * @param {import('./file-upload.js').BrowseEntry[]} entries
 * @param {string} query
 * @param {string} [locale]
 */
export function filterBrowseFilesByName(entries, query, locale = 'hu') {
  const needle = query.trim()
  if (!needle) return entries
  const folded = needle.toLocaleLowerCase(locale)
  return entries.filter((entry) => entry.name.toLocaleLowerCase(locale).includes(folded))
}
