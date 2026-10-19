/** Felső menüsor menük azonosítói (angol kulcs, magyar felirat a menubar-defs-ben). */
export const MENUBAR_MENU_IDS = ['file', 'edit', 'view', 'format']

/** @typedef {typeof MENUBAR_MENU_IDS[number]} MenubarMenuId */
/** @typedef {boolean | string[] | MenubarMenusConfig} MenubarOption */
/**
 * @typedef {Partial<Record<MenubarMenuId, boolean>> & { menus?: string[] }} MenubarMenusConfig
 */

/**
 * @param {MenubarOption | undefined} menubar
 * @returns {Set<MenubarMenuId> | null} null = nincs menüsor
 */
export function resolveMenubarMenus(menubar) {
  if (menubar === false || menubar == null) return null

  const all = /** @type {MenubarMenuId[]} */ ([...MENUBAR_MENU_IDS])

  if (menubar === true) {
    return new Set(all)
  }

  if (Array.isArray(menubar)) {
    const set = new Set(
      menubar.filter((id) => MENUBAR_MENU_IDS.includes(/** @type {MenubarMenuId} */ (id))),
    )
    return set.size > 0 ? set : null
  }

  if (typeof menubar === 'object') {
    if (Array.isArray(menubar.menus)) {
      const set = new Set(
        menubar.menus.filter((id) => MENUBAR_MENU_IDS.includes(/** @type {MenubarMenuId} */ (id))),
      )
      return set.size > 0 ? set : null
    }

    const set = new Set(all.filter((id) => menubar[id] !== false))
    return set.size > 0 ? set : null
  }

  return new Set(all)
}
