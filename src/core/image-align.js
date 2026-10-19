import { NodeSelection } from '@tiptap/pm/state'

/** @typedef {'left' | 'center' | 'right' | 'justify'} TextAlignValue */
/** @typedef {'left' | 'center' | 'right'} ImageAlignValue */

/**
 * @param {import('@tiptap/core').Editor} editor
 */
export function isImageNodeSelected(editor) {
  const { selection } = editor.state
  return selection instanceof NodeSelection && selection.node.type.name === 'image'
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @returns {ImageAlignValue | null}
 */
export function getImageAlign(editor) {
  if (!isImageNodeSelected(editor)) return null
  const align = editor.getAttributes('image').align
  if (align === 'center' || align === 'right') return align
  return 'left'
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {ImageAlignValue} align
 */
export function setImageAlign(editor, align) {
  if (!isImageNodeSelected(editor)) return false
  return editor.chain().focus().updateAttributes('image', { align }).run()
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {TextAlignValue} align
 */
export function applyBlockOrImageAlign(editor, align) {
  if (isImageNodeSelected(editor)) {
    if (align === 'justify') return setImageAlign(editor, 'left')
    return setImageAlign(editor, align)
  }
  if (align === 'left') {
    return editor.chain().focus().unsetTextAlign().run()
  }
  return editor.chain().focus().setTextAlign(align).run()
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {TextAlignValue} align
 */
export function isBlockOrImageAlignActive(editor, align) {
  const imageAlign = getImageAlign(editor)
  if (imageAlign !== null) {
    if (align === 'justify') return false
    return imageAlign === align
  }
  if (align === 'left') return getTextAlignForParagraph(editor) === 'left'
  return getTextAlignForParagraph(editor) === align
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @returns {TextAlignValue}
 */
function getTextAlignForParagraph(editor) {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      const value = node.attrs.textAlign
      if (value === 'center' || value === 'right' || value === 'justify') return value
      return 'left'
    }
  }
  return 'left'
}
