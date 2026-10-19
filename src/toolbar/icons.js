/**
 * Egységes vonalstílus (Lucide / Office-szerű ikonok).
 * @param {string} inner SVG path/line elemek
 */
function icon(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
}

/** @type {Record<string, string>} */
export const TOOLBAR_ICONS = {
  bold: icon(
    '<path d="M6 12h9a4 4 0 0 0 0-8H6v8z"/><path d="M6 20h11a4 4 0 0 0 0-8H6v8z"/>',
  ),
  italic: icon('<path d="M19 4h-9M14 20h-9M15 4 9 20"/>'),
  underline: icon(
    '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16"/>',
  ),
  strike: icon(
    '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><path d="M4 12h16"/>',
  ),
  // x₂ / x² stílus (Word-szerű, nem keresztező „dupla x”)
  subscript: icon(
    '<path d="M5 7.5 8.5 11.5"/><path d="M8.5 7.5 5 11.5"/>' +
      '<path d="M14 19h3.5"/><path d="M14 16.5h2.25a1.35 1.35 0 0 1 0 2.7H14"/>' +
      '<path d="M3 20.5h18"/>',
  ),
  superscript: icon(
    '<path d="M5 12.5 8.5 16.5"/><path d="M8.5 12.5 5 16.5"/>' +
      '<path d="M14 8h3.5"/><path d="M14 5.5h2.25a1.35 1.35 0 0 1 0 2.7H14"/>',
  ),
  // Formátummásoló ecset (Lucide brush – ecsetfej + markolat)
  formatPainter: icon(
    '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>' +
      '<path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
  ),
  letterSpacing: icon(
    '<path d="M4 12h16"/><path d="M8 8v8"/><path d="M16 8v8"/>' +
      '<path d="M6 12 4 10"/><path d="M6 12 4 14"/><path d="M18 12 20 10"/><path d="M18 12 20 14"/>',
  ),
  lineHeight: icon(
    '<path d="M8 4v16"/><path d="M12 7h8"/><path d="M12 12h8"/><path d="M12 17h8"/>' +
      '<path d="M6 9 4 11 6 13"/><path d="M6 15 4 13 6 11"/>',
  ),
  // Nagy „A” – a szín a gomb alatti csíkon látszik (Word / Google Docs minta)
  textColor: icon(
    '<path d="M7 16 12 5 17 16"/><path d="M9.5 12.5h5"/>',
  ),
  textBackground: icon(
    '<path d="m3 20 8.5-8.5"/><path d="m14 4 6 6-8.5 8.5-6-6z"/><path d="M6 18h12"/>',
  ),
  chevronDown: icon('<path d="m6 9 6 6 6-6"/>'),
  bulletList: icon(
    '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  ),
  orderedList: icon(
    '<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  ),
  blockquote: icon(
    '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4"/>',
  ),
  insertTable: icon(
    '<path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>',
  ),
  indentIncrease: icon(
    '<path d="M21 6H3"/><path d="M17 12H7"/><path d="M21 18H7"/>' +
      '<path d="M3 12h2"/><path d="M3 18h2"/>',
  ),
  indentDecrease: icon(
    '<path d="M21 6H3"/><path d="M21 12H11"/><path d="M21 18H11"/>' +
      '<path d="M3 12h2"/><path d="M3 18h2"/>',
  ),
  alignLeft: icon(
    '<path d="M21 6H3"/><path d="M15 12H3"/><path d="M17 18H3"/>',
  ),
  alignCenter: icon(
    '<path d="M21 6H3"/><path d="M17 12H7"/><path d="M19 18H5"/>',
  ),
  alignRight: icon(
    '<path d="M21 6H3"/><path d="M21 12H9"/><path d="M21 18H7"/>',
  ),
  alignJustify: icon(
    '<path d="M21 6H3"/><path d="M21 12H3"/><path d="M21 18H3"/>',
  ),
  sourceCode: icon(
    '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  ),
  exportPdf: icon(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
      '<path d="M14 2v6h6"/><path d="M10 13h4"/><path d="M10 17h4"/><path d="M8 13h.01"/><path d="M8 17h.01"/>',
  ),
  importWord: icon(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
      '<path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
  ),
  link: icon(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  ),
  insertMedia: icon(
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 6"/><circle cx="9" cy="9" r="1.5"/>',
  ),
  fileManager: icon(
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>' +
      '<path d="M12 10v6"/><path d="M9 13h6"/>',
  ),
  undo: icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>'),
  redo: icon('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/>'),
  fullscreen: icon(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  ),
  fullscreenExit: icon(
    '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
  ),
}

/**
 * @param {string} id
 * @returns {HTMLElement | null}
 */
export function createToolbarIcon(id) {
  const markup = TOOLBAR_ICONS[id]
  if (!markup) return null

  const wrap = document.createElement('span')
  wrap.className = 'bonsai-editor__toolbar-icon'
  wrap.setAttribute('aria-hidden', 'true')

  const tpl = document.createElement('template')
  tpl.innerHTML = markup.trim()
  const svg = tpl.content.firstElementChild
  if (!svg) return null
  wrap.appendChild(svg)
  return wrap
}
