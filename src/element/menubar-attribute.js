/**
 * @param {HTMLElement} el
 * @returns {import('../menubar/menubar-config.js').MenubarOption}
 */
export function resolveMenubarFromElement(el) {
  if ('menubarConfig' in el && el.menubarConfig != null) {
    return /** @type {import('../menubar/menubar-config.js').MenubarOption} */ (el.menubarConfig)
  }

  const list = el.getAttribute('menubar-menus')
  if (list) {
    return list
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  if (el.hasAttribute('menubar')) {
    return true
  }

  return false
}
