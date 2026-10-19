import { Extension } from '@tiptap/core'

/** @typedef {import('@tiptap/core').Editor} Editor */

/**
 * @param {Editor} editor
 * @param {string[]} types
 */
/**
 * @param {Editor} editor
 * @param {string} listItemType
 */
function isSelectionInListItem(editor, listItemType) {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === listItemType) return true
  }
  return false
}

export function findIndentBlockAtSelection(editor, types) {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (types.includes(node.type.name)) {
      return {
        node,
        pos: $from.before(depth),
        level: Number(node.attrs.textIndent) || 0,
      }
    }
  }
  return null
}

/**
 * @param {string | null | undefined} marginLeft
 * @param {number} stepEm
 */
export function parseTextIndentLevel(marginLeft, stepEm) {
  if (!marginLeft) return 0
  const trimmed = marginLeft.trim().toLowerCase()
  const emMatch = trimmed.match(/^([\d.]+)em$/)
  if (emMatch) {
    const level = Math.round(parseFloat(emMatch[1]) / stepEm)
    return Number.isFinite(level) && level > 0 ? level : 0
  }
  return 0
}

export const TextIndent = Extension.create({
  name: 'textIndent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      listItemType: 'listItem',
      minLevel: 0,
      maxLevel: 10,
      stepEm: 1.5,
    }
  },

  addGlobalAttributes() {
    const stepEm = this.options.stepEm
    return [
      {
        types: this.options.types,
        attributes: {
          textIndent: {
            default: 0,
            parseHTML: (element) =>
              parseTextIndentLevel(element.style.marginLeft, stepEm),
            renderHTML: (attributes) => {
              const level = Number(attributes.textIndent) || 0
              if (level <= 0) return {}
              return { style: `margin-left: ${level * stepEm}em` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    const options = this.options

    return {
      increaseTextIndent:
        () =>
        ({ editor, tr, dispatch }) => {
          const inListItem = isSelectionInListItem(editor, options.listItemType)
          if (inListItem && editor.can().sinkListItem(options.listItemType)) {
            return editor.chain().focus().sinkListItem(options.listItemType).run()
          }

          const block = findIndentBlockAtSelection(editor, options.types)
          if (!block) return false
          if (block.level >= options.maxLevel) return false

          if (dispatch) {
            tr.setNodeMarkup(block.pos, undefined, {
              ...block.node.attrs,
              textIndent: block.level + 1,
            })
          }
          return true
        },

      decreaseTextIndent:
        () =>
        ({ editor, tr, dispatch }) => {
          const inListItem = isSelectionInListItem(editor, options.listItemType)
          if (inListItem && editor.can().liftListItem(options.listItemType)) {
            return editor.chain().focus().liftListItem(options.listItemType).run()
          }

          const block = findIndentBlockAtSelection(editor, options.types)
          if (!block || block.level <= options.minLevel) return false

          if (dispatch) {
            tr.setNodeMarkup(block.pos, undefined, {
              ...block.node.attrs,
              textIndent: block.level - 1,
            })
          }
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.increaseTextIndent(),
      'Shift-Tab': () => this.editor.commands.decreaseTextIndent(),
    }
  },
})
