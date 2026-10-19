/**
 * @typedef {import('./menubar-config.js').MenubarMenuId} MenubarMenuId
 * @typedef {{ kind: 'item'; action: string } | { kind: 'sep' } | { kind: 'headingLevels' }} MenubarMenuEntry
 */

/** @type {Record<MenubarMenuId, { items: MenubarMenuEntry[] }>} */
export const MENUBAR_MENU_DEFS = {
  file: {
    items: [
      { kind: 'item', action: 'fileManager' },
      { kind: 'sep' },
      { kind: 'item', action: 'exportPdf' },
      { kind: 'item', action: 'importWord' },
      { kind: 'item', action: 'copyContent' },
      { kind: 'sep' },
      { kind: 'item', action: 'clearContent' },
    ],
  },
  edit: {
    items: [
      { kind: 'item', action: 'undo' },
      { kind: 'item', action: 'redo' },
      { kind: 'sep' },
      { kind: 'item', action: 'cut' },
      { kind: 'item', action: 'copy' },
      { kind: 'item', action: 'paste' },
      { kind: 'sep' },
      { kind: 'item', action: 'selectAll' },
    ],
  },
  view: {
    items: [
      { kind: 'item', action: 'sourceCode' },
      { kind: 'item', action: 'fullscreen' },
    ],
  },
  format: {
    items: [
      { kind: 'item', action: 'paragraph' },
      { kind: 'headingLevels' },
      { kind: 'sep' },
      { kind: 'item', action: 'bold' },
      { kind: 'item', action: 'italic' },
      { kind: 'item', action: 'underline' },
      { kind: 'item', action: 'strike' },
      { kind: 'item', action: 'subscript' },
      { kind: 'item', action: 'superscript' },
      { kind: 'item', action: 'formatPainter' },
      { kind: 'sep' },
      { kind: 'item', action: 'bulletList' },
      { kind: 'item', action: 'orderedList' },
      { kind: 'item', action: 'blockquote' },
      { kind: 'sep' },
      { kind: 'item', action: 'indentIncrease' },
      { kind: 'item', action: 'indentDecrease' },
      { kind: 'item', action: 'alignLeft' },
      { kind: 'item', action: 'alignCenter' },
      { kind: 'item', action: 'alignRight' },
      { kind: 'item', action: 'alignJustify' },
      { kind: 'sep' },
      { kind: 'item', action: 'link' },
      { kind: 'item', action: 'insertMedia' },
    ],
  },
}

/** @type {MenubarMenuId[]} */
export const MENUBAR_MENU_ORDER = ['file', 'edit', 'view', 'format']
