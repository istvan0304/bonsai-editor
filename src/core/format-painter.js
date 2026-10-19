import { getTextAlignFromPos } from './text-align.js'

/**
 * @typedef {import('./editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {{
 *   bold: boolean;
 *   italic: boolean;
 *   underline: boolean;
 *   strike: boolean;
 *   subscript: boolean;
 *   superscript: boolean;
 *   link: string | null;
 *   fontFamily: string | null;
 *   letterSpacing: string | null;
 *   lineHeight: string | null;
 *   color: string | null;
 *   backgroundColor: string | null;
 * }} CopiedMarks
 * @typedef {
 *   | { type: 'paragraph' }
 *   | { type: 'heading'; level: number }
 *   | { type: 'blockquote' }
 *   | { type: 'bulletList' }
 *   | { type: 'orderedList' }
 * } CopiedBlock
 * @typedef {import('./text-align.js').TextAlignValue} TextAlignValue
 * @typedef {{ marks: CopiedMarks; block: CopiedBlock; textAlign: TextAlignValue }} CopiedFormat
 */

/**
 * @param {import('@tiptap/core').Editor} editor
 * @returns {CopiedFormat}
 */
export function readFormatFromEditor(editor) {
  const { state } = editor
  const { $from } = state.selection
  const marksAt = state.storedMarks ?? $from.marks()

  /** @type {CopiedMarks} */
  const marks = {
    bold: marksAt.some((m) => m.type.name === 'bold'),
    italic: marksAt.some((m) => m.type.name === 'italic'),
    underline: marksAt.some((m) => m.type.name === 'underline'),
    strike: marksAt.some((m) => m.type.name === 'strike'),
    subscript: marksAt.some((m) => m.type.name === 'subscript'),
    superscript: marksAt.some((m) => m.type.name === 'superscript'),
    link: marksAt.find((m) => m.type.name === 'link')?.attrs.href ?? null,
    fontFamily: marksAt.find((m) => m.type.name === 'textStyle')?.attrs.fontFamily ?? null,
    letterSpacing: marksAt.find((m) => m.type.name === 'textStyle')?.attrs.letterSpacing ?? null,
    lineHeight: marksAt.find((m) => m.type.name === 'textStyle')?.attrs.lineHeight ?? null,
    color: marksAt.find((m) => m.type.name === 'textStyle')?.attrs.color ?? null,
    backgroundColor: marksAt.find((m) => m.type.name === 'textStyle')?.attrs.backgroundColor ?? null,
  }

  return {
    marks,
    block: readBlockFromPos($from),
    textAlign: getTextAlignFromPos($from),
  }
}

/**
 * @param {import('prosemirror-model').ResolvedPos} $from
 * @returns {CopiedBlock}
 */
export function readBlockFromPos($from) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    const name = node.type.name

    if (name === 'heading') {
      return { type: 'heading', level: Number(node.attrs.level) || 1 }
    }
    if (name === 'blockquote') {
      return { type: 'blockquote' }
    }
    if (name === 'listItem') {
      const list = $from.node(depth - 1)
      if (list.type.name === 'bulletList') return { type: 'bulletList' }
      if (list.type.name === 'orderedList') return { type: 'orderedList' }
    }
    if (name === 'paragraph') {
      return { type: 'paragraph' }
    }
  }
  return { type: 'paragraph' }
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {CopiedFormat} format
 */
export function applyFormatToEditor(editor, format) {
  applyBlockFormat(editor, format.block)
  applyTextAlignFormat(editor, format.textAlign)
  applyMarksFormat(editor, format.marks)
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {TextAlignValue} textAlign
 */
export function applyTextAlignFormat(editor, textAlign) {
  if (textAlign === 'left') {
    editor.chain().focus().unsetTextAlign().run()
    return
  }
  editor.chain().focus().setTextAlign(textAlign).run()
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {CopiedBlock} block
 */
export function applyBlockFormat(editor, block) {
  let chain = editor.chain().focus()

  const wantBullet = block.type === 'bulletList'
  const wantOrdered = block.type === 'orderedList'
  const wantQuote = block.type === 'blockquote'

  if (editor.isActive('bulletList') && !wantBullet) chain = chain.toggleBulletList()
  if (editor.isActive('orderedList') && !wantOrdered) chain = chain.toggleOrderedList()
  if (editor.isActive('blockquote') && !wantQuote) chain = chain.toggleBlockquote()

  if (wantBullet && !editor.isActive('bulletList')) {
    chain = chain.toggleBulletList()
  } else if (wantOrdered && !editor.isActive('orderedList')) {
    chain = chain.toggleOrderedList()
  } else if (wantQuote && !editor.isActive('blockquote')) {
    chain = chain.toggleBlockquote()
  } else if (block.type === 'heading') {
    chain = chain.setHeading({ level: block.level })
  } else if (block.type === 'paragraph') {
    chain = chain.setParagraph()
  }

  chain.run()
}

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {CopiedMarks} marks
 */
export function applyMarksFormat(editor, marks) {
  let chain = editor.chain().focus()

  chain = chain
    .unsetMark('bold')
    .unsetMark('italic')
    .unsetMark('underline')
    .unsetMark('strike')
    .unsetMark('subscript')
    .unsetMark('superscript')
    .unsetLink()

  if (marks.bold) chain = chain.setMark('bold')
  if (marks.italic) chain = chain.setMark('italic')
  if (marks.underline) chain = chain.setMark('underline')
  if (marks.strike) chain = chain.setMark('strike')
  if (marks.subscript) chain = chain.setMark('subscript')
  if (marks.superscript) chain = chain.setMark('superscript')
  if (marks.link) chain = chain.setMark('link', { href: marks.link })

  if (marks.fontFamily) chain = chain.setFontFamily(marks.fontFamily)
  else chain = chain.unsetFontFamily()

  if (marks.letterSpacing) chain = chain.setLetterSpacing(marks.letterSpacing)
  else chain = chain.unsetLetterSpacing()

  if (marks.lineHeight) chain = chain.setLineHeight(marks.lineHeight)
  else chain = chain.unsetLineHeight()

  if (marks.color) chain = chain.setColor(marks.color)
  else chain = chain.unsetColor()

  if (marks.backgroundColor) chain = chain.setBackgroundColor(marks.backgroundColor)
  else chain = chain.unsetBackgroundColor()

  chain.run()
}

export class FormatPainter {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {CopiedFormat | null} */
  #format = null

  /** @type {boolean} */
  #armed = false

  /** @type {boolean} */
  #sticky = false

  /** @type {{ from: number; to: number } | null} */
  #ignoreSelection = null

  /** @type {(() => void) | null} */
  #onSelection = null

  /** @type {(e: KeyboardEvent) => void} */
  #onKey

  /**
   * @param {BonsaiEditor} editor
   */
  constructor(editor) {
    this.#editor = editor
    this.#onKey = (e) => {
      if (e.key === 'Escape') this.cancel()
    }
  }

  get isArmed() {
    return this.#armed
  }

  get isSticky() {
    return this.#sticky
  }

  /**
   * @param {{ sticky?: boolean }} [opts]
   */
  copyAndArm(opts = {}) {
    if (this.#editor.isDestroyed || this.#editor.isSourceView) return

    const tiptap = this.#editor.tiptap
    this.#format = readFormatFromEditor(tiptap)
    const { from, to } = tiptap.state.selection
    this.#ignoreSelection = { from, to }

    this.#armed = true
    this.#sticky = opts.sticky ?? false
    this.#editor.rootElement.classList.add('bonsai-editor--format-paint')

    if (!this.#onSelection) {
      this.#onSelection = () => this.#handleSelection()
      this.#editor.on('selectionUpdate', this.#onSelection)
    }
    document.addEventListener('keydown', this.#onKey)
    this.#editor.syncChrome()
  }

  cancel() {
    if (!this.#armed) return
    this.#armed = false
    this.#sticky = false
    this.#format = null
    this.#ignoreSelection = null
    this.#editor.rootElement.classList.remove('bonsai-editor--format-paint')
    document.removeEventListener('keydown', this.#onKey)
    this.#editor.syncChrome()
  }

  toggle({ sticky = false } = {}) {
    if (this.#armed) {
      this.cancel()
      return
    }
    this.copyAndArm({ sticky })
  }

  #handleSelection() {
    if (!this.#armed || !this.#format || this.#editor.isSourceView) return

    const { state } = this.#editor.tiptap
    const { from, to, empty } = state.selection

    if (this.#ignoreSelection && from === this.#ignoreSelection.from && to === this.#ignoreSelection.to) {
      return
    }
    this.#ignoreSelection = null

    if (empty) return

    applyFormatToEditor(this.#editor.tiptap, this.#format)

    if (!this.#sticky) {
      this.cancel()
    } else {
      this.#editor.syncChrome()
    }
  }

  destroy() {
    this.cancel()
    if (this.#onSelection) {
      this.#editor.off('selectionUpdate', this.#onSelection)
      this.#onSelection = null
    }
  }
}
