/** @typedef {{ id: string; label: string; value: string | null }} FontFamilyChoice */

/** @type {FontFamilyChoice[]} */
export const DEFAULT_FONT_FAMILIES = [
  { id: 'default', label: 'Alapértelmezett', value: null },
  { id: 'sans', label: 'Sans-serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { id: 'serif', label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: 'Monospace', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  { id: 'arial', label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { id: 'times', label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { id: 'courier', label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { id: 'verdana', label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
]

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {FontFamilyChoice[]} [choices]
 * @returns {string | null}
 */
export function getActiveFontFamilyValue(editor, choices = DEFAULT_FONT_FAMILIES) {
  const current = editor.getAttributes('textStyle').fontFamily
  if (current == null || current === '') return null
  const exact = choices.find((c) => c.value === current)
  return exact ? exact.value : current
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {FontFamilyChoice[]} [choices]
 */
export function getActiveFontFamilyLabel(editor, choices = DEFAULT_FONT_FAMILIES) {
  const current = editor.getAttributes('textStyle').fontFamily
  if (current == null || current === '') return choices[0]?.label ?? 'Alapértelmezett'
  const match = choices.find((c) => c.value === current)
  if (match) return match.label
  const first = String(current).split(',')[0]?.replace(/^["']|["']$/g, '').trim()
  return first || (choices[0]?.label ?? 'Alapértelmezett')
}
