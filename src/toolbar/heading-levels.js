/** @type {readonly number[]} */
export const DEFAULT_HEADING_LEVELS = [1, 2, 3, 4, 5, 6]

/** @type {Record<number, string>} */
export const HEADING_LABELS = {
  1: 'Címsor 1',
  2: 'Címsor 2',
  3: 'Címsor 3',
  4: 'Címsor 4',
  5: 'Címsor 5',
  6: 'Címsor 6',
}

/**
 * @param {import('../core/editor.js').BonsaiEditor} editor
 * @returns {number[]}
 */
export function getHeadingLevels(editor) {
  const ext = editor.tiptap.extensionManager.extensions.find((e) => e.name === 'heading')
  const levels = ext?.options?.levels
  if (Array.isArray(levels) && levels.length) {
    return [...levels].sort((a, b) => a - b)
  }
  return [...DEFAULT_HEADING_LEVELS]
}

/**
 * @param {import('../core/editor.js').BonsaiEditor} editor
 * @returns {number | null} aktív címsor szint, vagy null ha normál bekezdés
 */
export function getActiveHeadingLevel(editor) {
  for (let level = 1; level <= 6; level += 1) {
    if (editor.tiptap.isActive('heading', { level })) return level
  }
  return null
}
