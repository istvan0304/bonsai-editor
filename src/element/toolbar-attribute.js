/**
 * @param {HTMLElement} el
 * @returns {import('../toolbar/toolbar-config.js').ToolbarOption}
 */
export function resolveToolbarFromElement(el) {
  if ('toolbarConfig' in el && el.toolbarConfig != null) {
    return /** @type {import('../toolbar/toolbar-config.js').ToolbarOption} */ (el.toolbarConfig)
  }

  const list = el.getAttribute('toolbar-items')
  if (list) {
    return list
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  if (el.hasAttribute('toolbar')) {
    return true
  }

  return false
}
