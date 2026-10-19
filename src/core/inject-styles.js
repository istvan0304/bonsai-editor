let injected = false

/**
 * @param {string} cssText
 */
export function injectBonsaiStyles(cssText) {
  if (injected || typeof document === 'undefined') return
  if (document.getElementById('bonsai-editor-styles')) {
    injected = true
    return
  }
  const style = document.createElement('style')
  style.id = 'bonsai-editor-styles'
  style.textContent = cssText
  document.head.appendChild(style)
  injected = true
}
