/**
 * @param {string | null | undefined} raw
 * @returns {number | null}
 */
export function letterSpacingToNumber(raw) {
  if (raw == null || raw === '' || raw === 'normal') return null
  const text = String(raw).trim()
  const em = text.match(/^(-?[\d.]+)em$/i)
  if (em) return Number.parseFloat(em[1])
  const px = text.match(/^(-?[\d.]+)px$/i)
  if (px) return Number.parseFloat(px[1]) / 16
  const num = Number.parseFloat(text)
  return Number.isFinite(num) ? num : null
}

/**
 * @param {number | null | undefined} value
 * @returns {string | null}
 */
export function numberToLetterSpacing(value) {
  if (value == null || !Number.isFinite(value)) return null
  const rounded = Math.round(value * 1000) / 1000
  return `${rounded}em`
}

/**
 * @param {import('@tiptap/core').Editor} editor
 */
export function getActiveLetterSpacingRaw(editor) {
  const raw = editor.getAttributes('textStyle').letterSpacing
  if (raw == null || raw === '' || raw === 'normal') return null
  return String(raw)
}

/**
 * @param {string | null | undefined} raw
 * @returns {number | null}
 */
export function lineHeightToNumber(raw) {
  if (raw == null || raw === '' || raw === 'normal') return null
  const text = String(raw).trim()
  const unitless = text.match(/^([\d.]+)$/)
  if (unitless) return Number.parseFloat(unitless[1])
  const px = text.match(/^([\d.]+)px$/i)
  if (px) return Number.parseFloat(px[1])
  const num = Number.parseFloat(text)
  return Number.isFinite(num) ? num : null
}

/**
 * @param {number | null | undefined} value
 * @returns {string | null}
 */
export function numberToLineHeight(value) {
  if (value == null || !Number.isFinite(value)) return null
  const rounded = Math.round(value * 100) / 100
  return String(rounded)
}

/**
 * @param {import('@tiptap/core').Editor} editor
 */
export function getActiveLineHeightRaw(editor) {
  const raw = editor.getAttributes('textStyle').lineHeight
  if (raw == null || raw === '' || raw === 'normal') return null
  return String(raw)
}
