/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {import('./editor-actions.js').EditorAction} EditorAction
 */

/**
 * @param {unknown} error
 */
/**
 * @param {unknown} error
 * @param {import('../i18n/index.js').TranslateFn} [t]
 */
export function reportEditorActionError(error, t) {
  const fallback = t?.('error.operationFailed') ?? 'A művelet sikertelen.'
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : fallback
  window.alert(message || fallback)
}

/**
 * @param {BonsaiEditor} editor
 * @param {EditorAction} action
 * @returns {Promise<void>}
 */
export function runEditorAction(editor, action) {
  return Promise.resolve(action.run(editor)).catch((error) => {
    reportEditorActionError(error, editor.t)
  })
}
