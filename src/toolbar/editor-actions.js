import { HEADING_LABELS } from './heading-levels.js'
import { applyBlockOrImageAlign, isBlockOrImageAlignActive } from '../core/image-align.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {{ label: string; run: (editor: BonsaiEditor) => void | Promise<void>; isActive?: (editor: BonsaiEditor) => boolean; canRun?: (editor: BonsaiEditor) => boolean }} EditorAction
 */

/** @type {Record<string, EditorAction>} */
export const EDITOR_ACTIONS = {
  bold: {
    label: 'Félkövér',
    run: (e) => e.tiptap.chain().focus().toggleBold().run(),
    isActive: (e) => e.tiptap.isActive('bold'),
  },
  italic: {
    label: 'Dőlt',
    run: (e) => e.tiptap.chain().focus().toggleItalic().run(),
    isActive: (e) => e.tiptap.isActive('italic'),
  },
  underline: {
    label: 'Aláhúzott',
    run: (e) => e.tiptap.chain().focus().toggleUnderline().run(),
    isActive: (e) => e.tiptap.isActive('underline'),
  },
  strike: {
    label: 'Áthúzott',
    run: (e) => e.tiptap.chain().focus().toggleStrike().run(),
    isActive: (e) => e.tiptap.isActive('strike'),
  },
  subscript: {
    label: 'Alsó index',
    run: (e) => e.tiptap.chain().focus().unsetMark('superscript').toggleSubscript().run(),
    isActive: (e) => e.tiptap.isActive('subscript'),
  },
  superscript: {
    label: 'Felső index',
    run: (e) => e.tiptap.chain().focus().unsetMark('subscript').toggleSuperscript().run(),
    isActive: (e) => e.tiptap.isActive('superscript'),
  },
  bulletList: {
    label: 'Felsorolás',
    run: (e) => e.tiptap.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.tiptap.isActive('bulletList'),
  },
  orderedList: {
    label: 'Számozott lista',
    run: (e) => e.tiptap.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.tiptap.isActive('orderedList'),
  },
  blockquote: {
    label: 'Idézet',
    run: (e) => e.tiptap.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.tiptap.isActive('blockquote'),
  },
  indentIncrease: {
    label: 'Behúzás növelése',
    run: (e) => e.tiptap.chain().focus().increaseTextIndent().run(),
    canRun: (e) => e.tiptap.can().chain().focus().increaseTextIndent().run(),
  },
  indentDecrease: {
    label: 'Behúzás csökkentése',
    run: (e) => e.tiptap.chain().focus().decreaseTextIndent().run(),
    canRun: (e) => e.tiptap.can().chain().focus().decreaseTextIndent().run(),
  },
  alignLeft: {
    label: 'Balra igazítás',
    run: (e) => {
      applyBlockOrImageAlign(e.tiptap, 'left')
    },
    isActive: (e) => isBlockOrImageAlignActive(e.tiptap, 'left'),
  },
  alignCenter: {
    label: 'Középre igazítás',
    run: (e) => {
      applyBlockOrImageAlign(e.tiptap, 'center')
    },
    isActive: (e) => isBlockOrImageAlignActive(e.tiptap, 'center'),
  },
  alignRight: {
    label: 'Jobbra igazítás',
    run: (e) => {
      applyBlockOrImageAlign(e.tiptap, 'right')
    },
    isActive: (e) => isBlockOrImageAlignActive(e.tiptap, 'right'),
  },
  alignJustify: {
    label: 'Sorkizárás',
    run: (e) => {
      applyBlockOrImageAlign(e.tiptap, 'justify')
    },
    isActive: (e) => isBlockOrImageAlignActive(e.tiptap, 'justify'),
  },
  sourceCode: {
    label: 'Forráskód',
    run: (e) => {
      e.toggleSourceView()
    },
    isActive: (e) => e.isSourceView,
  },
  exportPdf: {
    label: 'PDF exportálás',
    run: async (e) => {
      await e.exportPdf()
    },
  },
  importWord: {
    label: 'Word importálás…',
    run: async (e) => {
      await e.importWordFromPicker()
    },
    canRun: (e) => !e.isSourceView,
  },
  fileManager: {
    label: 'Fájlkezelő',
    run: (e) => {
      e.fileManager?.open()
    },
    isActive: (e) => e.fileManager?.isOpen ?? false,
    canRun: (e) => !e.isSourceView && e.fileManager != null,
  },
  insertMedia: {
    label: 'Média beszúrása…',
    run: (e) => {
      const url = window.prompt(e.t('prompt.mediaUrl'), 'https://')
      if (url === null || url.trim() === '') return
      e.insertMediaFromUrl(url)
    },
    canRun: (e) => !e.isSourceView,
  },
  link: {
    label: 'Link…',
    run: (e) => {
      const prev = e.tiptap.getAttributes('link').href
      const url = window.prompt(e.t('prompt.linkUrl'), prev || 'https://')
      if (url === null) return
      if (url === '') {
        e.tiptap.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      e.tiptap.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
    isActive: (e) => e.tiptap.isActive('link'),
  },
  undo: {
    label: 'Visszavonás',
    run: (e) => e.tiptap.chain().focus().undo().run(),
    canRun: (e) => e.tiptap.can().chain().focus().undo().run(),
  },
  redo: {
    label: 'Újra',
    run: (e) => e.tiptap.chain().focus().redo().run(),
    canRun: (e) => e.tiptap.can().chain().focus().redo().run(),
  },
  fullscreen: {
    label: 'Teljes képernyő',
    run: (e) => {
      void e.toggleFullscreen()
    },
    isActive: (e) => e.isFullscreen,
  },
  clearContent: {
    label: 'Ürítés',
    run: (e) => e.setContent('<p></p>', { emitUpdate: true }),
  },
  copyContent: {
    label: 'Tartalom másolása',
    run: async (e) => {
      const value = e.getValue()
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      await navigator.clipboard.writeText(text)
    },
  },
  cut: {
    label: 'Kivágás',
    run: (e) => {
      e.focus()
      document.execCommand('cut')
    },
  },
  copy: {
    label: 'Másolás',
    run: (e) => {
      e.focus()
      document.execCommand('copy')
    },
  },
  paste: {
    label: 'Beillesztés',
    run: (e) => {
      e.focus()
      document.execCommand('paste')
    },
  },
  selectAll: {
    label: 'Összes kijelölése',
    run: (e) => {
      if (e.isSourceView) {
        const ta = e.rootElement.querySelector('.bonsai-editor__source-textarea')
        if (ta instanceof HTMLTextAreaElement) {
          ta.focus()
          ta.select()
          return
        }
      }
      e.tiptap.chain().focus().selectAll().run()
    },
  },
  formatPainter: {
    label: 'Formátum másoló',
    run: (e) => {
      e.formatPainter.toggle()
    },
    isActive: (e) => e.formatPainter.isArmed,
  },
  paragraph: {
    label: 'Normál szöveg',
    run: (e) => e.tiptap.chain().focus().setParagraph().run(),
    isActive: (e) =>
      e.tiptap.isActive('paragraph') &&
      !e.tiptap.isActive('heading') &&
      !e.tiptap.isActive('bulletList') &&
      !e.tiptap.isActive('orderedList') &&
      !e.tiptap.isActive('blockquote'),
  },
}

/**
 * @param {number} level
 * @returns {EditorAction}
 */
/**
 * @param {number} level
 * @param {import('../i18n/index.js').TranslateFn} t
 * @returns {EditorAction}
 */
export function headingLevelAction(level, t) {
  const label = t('heading.level', { level })
  return {
    label,
    run: (e) => e.tiptap.chain().focus().toggleHeading({ level }).run(),
    isActive: (e) => e.tiptap.isActive('heading', { level }),
  }
}

/**
 * @param {string} id
 * @param {import('../i18n/index.js').TranslateFn} [t]
 * @returns {EditorAction | undefined}
 */
export function getEditorAction(id, t) {
  if (id.startsWith('heading:')) {
    const level = Number(id.slice(8))
    if (level >= 1 && level <= 6 && t) return headingLevelAction(level, t)
    if (level >= 1 && level <= 6) {
      const label = HEADING_LABELS[level] ?? `Címsor ${level}`
      return {
        label,
        run: (e) => e.tiptap.chain().focus().toggleHeading({ level }).run(),
        isActive: (e) => e.tiptap.isActive('heading', { level }),
      }
    }
    return undefined
  }
  const base = EDITOR_ACTIONS[id]
  if (!base) return undefined
  if (!t) return base
  return { ...base, label: t(`action.${id}`) }
}

/** Toolbar kompatibilitás – ugyanazok az azonosítók. */
export const TOOLBAR_BUTTON_DEFS = EDITOR_ACTIONS
