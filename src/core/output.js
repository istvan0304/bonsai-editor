/** @typedef {'html' | 'json'} OutputFormat */

export const OUTPUT_FORMATS = /** @type {const} */ (['html', 'json'])

/**
 * @param {string} format
 * @returns {asserts format is OutputFormat}
 */
export function assertOutputFormat(format) {
  if (!OUTPUT_FORMATS.includes(/** @type {OutputFormat} */ (format))) {
    throw new Error(`Invalid outputFormat: "${format}". Must be "html" or "json".`)
  }
}

/**
 * @param {import('@tiptap/core').Editor} tiptap
 * @param {OutputFormat} format
 */
export function getOutputValue(tiptap, format) {
  if (format === 'json') {
    return JSON.parse(JSON.stringify(tiptap.getJSON()))
  }
  return tiptap.getHTML()
}

/**
 * @param {unknown} a
 * @param {unknown} b
 */
export function valuesEqual(a, b) {
  if (a === b) return true
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return false
}
