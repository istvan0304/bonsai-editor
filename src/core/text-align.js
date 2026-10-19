/** @typedef {'left' | 'center' | 'right' | 'justify'} TextAlignValue */

/**
 * @param {import('@tiptap/core').Editor} editor
 * @returns {TextAlignValue}
 */
export function getTextAlign(editor) {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      const align = node.attrs.textAlign
      if (align === 'center' || align === 'right' || align === 'justify') return align
      return 'left'
    }
  }
  return 'left'
}

/**
 * @param {import('prosemirror-model').ResolvedPos} $from
 * @returns {TextAlignValue}
 */
export function getTextAlignFromPos($from) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      const align = node.attrs.textAlign
      if (align === 'center' || align === 'right' || align === 'justify') return align
      return 'left'
    }
  }
  return 'left'
}
