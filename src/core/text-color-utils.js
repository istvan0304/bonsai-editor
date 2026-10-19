/**
 * @param {string | null | undefined} input
 * @returns {string | null}
 */
export function normalizeHexColor(input) {
  if (input == null) return null
  const trimmed = String(input).trim()
  if (!trimmed) return null
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase()
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed.toLowerCase()}`
  return cssColorToHex(trimmed)
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function cssColorToHex(value) {
  if (!value) return null
  const text = String(value).trim()
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase()
  const rgb = text.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (rgb) {
    const parts = [rgb[1], rgb[2], rgb[3]].map((part) => {
      const n = Math.min(255, Math.max(0, Number.parseInt(part, 10)))
      return n.toString(16).padStart(2, '0')
    })
    return `#${parts.join('')}`
  }
  return null
}

/**
 * @param {import('@tiptap/core').Editor} editor
 */
export function getActiveTextColor(editor) {
  return editor.getAttributes('textStyle').color ?? null
}

/**
 * @param {import('@tiptap/core').Editor} editor
 */
export function getActiveTextBackgroundColor(editor) {
  return editor.getAttributes('textStyle').backgroundColor ?? null
}
