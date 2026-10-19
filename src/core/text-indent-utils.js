import { findIndentBlockAtSelection } from './text-indent-extension.js'

/** @typedef {import('@tiptap/core').Editor} Editor */

const INDENT_BLOCK_TYPES = ['paragraph', 'heading', 'blockquote']

/**
 * @param {Editor} editor
 */
export function getActiveTextIndentLevel(editor) {
  const block = findIndentBlockAtSelection(editor, INDENT_BLOCK_TYPES)
  return block?.level ?? 0
}
