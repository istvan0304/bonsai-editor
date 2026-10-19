/** Összes moduláris toolbar elem azonosítója. */
export const TOOLBAR_ITEM_IDS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'subscript',
  'superscript',
  'formatPainter',
  'fontFamily',
  'letterSpacing',
  'lineHeight',
  'textColor',
  'textBackground',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  'insertTable',
  'indentIncrease',
  'indentDecrease',
  'alignLeft',
  'alignCenter',
  'alignRight',
  'alignJustify',
  'sourceCode',
  'exportPdf',
  'importWord',
  'link',
  'insertMedia',
  'fileManager',
  'undo',
  'redo',
  'fullscreen',
]

/** @typedef {typeof TOOLBAR_ITEM_IDS[number]} ToolbarItemId */
/** @typedef {boolean | string[] | ToolbarItemsConfig} ToolbarOption */
/**
 * @typedef {Partial<Record<ToolbarItemId, boolean>> & { items?: string[] }} ToolbarItemsConfig
 */

/** @type {ToolbarItemId[][]} */
export const TOOLBAR_GROUPS = [
  ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'formatPainter'],
  ['fontFamily', 'letterSpacing', 'lineHeight', 'textColor', 'textBackground'],
  ['heading'],
  ['bulletList', 'orderedList', 'blockquote', 'insertTable'],
  ['indentIncrease', 'indentDecrease', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
  ['sourceCode', 'exportPdf', 'importWord', 'link', 'insertMedia', 'fileManager'],
  ['undo', 'redo'],
  ['fullscreen'],
]

/**
 * @param {ToolbarOption | undefined} toolbar
 * @returns {Set<ToolbarItemId> | null} null = nincs toolbar
 */
export function resolveToolbarItems(toolbar) {
  if (toolbar === false || toolbar == null) return null

  const all = /** @type {ToolbarItemId[]} */ ([...TOOLBAR_ITEM_IDS])

  if (toolbar === true) {
    return new Set(all)
  }

  if (Array.isArray(toolbar)) {
    const set = new Set(
      toolbar.filter((id) => TOOLBAR_ITEM_IDS.includes(/** @type {ToolbarItemId} */ (id))),
    )
    return set.size > 0 ? set : null
  }

  if (typeof toolbar === 'object') {
    if (Array.isArray(toolbar.items)) {
      const set = new Set(
        toolbar.items.filter((id) => TOOLBAR_ITEM_IDS.includes(/** @type {ToolbarItemId} */ (id))),
      )
      return set.size > 0 ? set : null
    }

    const set = new Set(all.filter((id) => toolbar[id] !== false))
    return set.size > 0 ? set : null
  }

  return new Set(all)
}

/**
 * @param {Set<ToolbarItemId>} enabled
 * @returns {Array<{ kind: 'sep' | 'heading' | 'fontFamily' | 'letterSpacing' | 'lineHeight' | 'textColor' | 'textBackground' | 'insertTable' | 'insertMedia' | 'button', id?: ToolbarItemId }>}
 */
export function buildToolbarMountPlan(enabled) {
  /** @type {Array<{ kind: 'sep' | 'heading' | 'fontFamily' | 'letterSpacing' | 'lineHeight' | 'textColor' | 'textBackground' | 'insertTable' | 'insertMedia' | 'button', id?: ToolbarItemId }>} */
  const plan = []

  for (const group of TOOLBAR_GROUPS) {
    const visible = group.filter((id) => enabled.has(id))
    if (!visible.length) continue

    if (plan.length > 0) {
      plan.push({ kind: 'sep' })
    }

    for (const id of visible) {
      if (id === 'heading') {
        plan.push({ kind: 'heading' })
      } else if (id === 'fontFamily') {
        plan.push({ kind: 'fontFamily' })
      } else if (id === 'letterSpacing') {
        plan.push({ kind: 'letterSpacing' })
      } else if (id === 'lineHeight') {
        plan.push({ kind: 'lineHeight' })
      } else if (id === 'textColor') {
        plan.push({ kind: 'textColor' })
      } else if (id === 'textBackground') {
        plan.push({ kind: 'textBackground' })
      } else if (id === 'insertTable') {
        plan.push({ kind: 'insertTable' })
      } else if (id === 'insertMedia') {
        plan.push({ kind: 'insertMedia' })
      } else {
        plan.push({ kind: 'button', id })
      }
    }
  }

  return plan
}
