import { Editor } from '@tiptap/core'
import { createExtensions } from './extensions.js'
import { assertOutputFormat, getOutputValue } from './output.js'
import { injectBonsaiStyles } from './inject-styles.js'
import { BonsaiToolbar } from '../toolbar/toolbar.js'
import { resolveToolbarItems } from '../toolbar/toolbar-config.js'
import { BonsaiMenubar } from '../menubar/menubar.js'
import { resolveMenubarMenus } from '../menubar/menubar-config.js'
import { SourceView } from './source-view.js'
import { FullscreenController } from './fullscreen.js'
import { FormatPainter } from './format-painter.js'
import { FileManager } from '../files/file-manager.js'
import { exportHtmlAsPdf } from './pdf-export.js'
import { convertDocxFileToHtml, pickDocxFile } from './word-import.js'
import { insertMediaIntoEditor } from './insert-media.js'
import { createTranslator, DEFAULT_LOCALE, resolveLocale } from '../i18n/index.js'

/**
 * @typedef {import('./output.js').OutputFormat} OutputFormat
 *
 * @typedef {Object} BonsaiEditorOptions
 * @property {HTMLElement} element
 * @property {string | object} [content]
 * @property {OutputFormat} [outputFormat]
 * @property {boolean} [editable]
 * @property {boolean | 'start' | 'end'} [autofocus]
 * @property {string} [placeholder]
 * @property {string} [ariaLabel]
 * @property {import('../i18n/index.js').BonsaiLocale | string} [locale]
 * @property {import('../toolbar/toolbar-config.js').ToolbarOption} [toolbar]
 * @property {import('../menubar/menubar-config.js').MenubarOption} [menubar]
 * @property {boolean} [injectStyles]
 * @property {string} [injectStylesCss]
 * @property {Record<string, unknown>} [features]
 * @property {import('@tiptap/core').Extensions} [extensions]
 * @property {boolean | import('../files/file-manager.js').FileManagerOptions} [fileManager]
 * @property {(editor: BonsaiEditor) => void} [onCreate]
 * @property {(value: string | object, editor: BonsaiEditor) => void} [onUpdate]
 * @property {(event: FocusEvent, editor: BonsaiEditor) => void} [onFocus]
 * @property {(event: FocusEvent, editor: BonsaiEditor) => void} [onBlur]
 * @property {(editor: BonsaiEditor) => void} [onSelectionUpdate]
 * @property {() => void} [onDestroy]
 */

/** @typedef {import('./pdf-export.js').PdfExportOptions} PdfExportOptions */
/** @typedef {import('./word-import.js').WordImportApplyOptions} WordImportApplyOptions */
/** @typedef {import('./word-import.js').WordImportResult & { cancelled?: boolean }} WordImportOutcome */

export class BonsaiEditor {
  /** @type {boolean} */
  #destroyed = false

  /** @type {OutputFormat} */
  #outputFormat

  /** @type {Editor | null} */
  #tiptap = null

  /** @type {BonsaiToolbar | null} */
  #toolbar = null

  /** @type {BonsaiMenubar | null} */
  #menubar = null

  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map()

  /** @type {HTMLElement} */
  #mountEl

  /** @type {HTMLElement} */
  #rootEl

  /** @type {SourceView} */
  #sourceView

  /** @type {FullscreenController} */
  #fullscreen

  /** @type {FormatPainter} */
  #formatPainter

  /** @type {FileManager | null} */
  #fileManager = null

  /** @type {import('../i18n/index.js').BonsaiLocale} */
  #locale = DEFAULT_LOCALE

  /** @type {import('../i18n/index.js').TranslateFn} */
  #t = createTranslator(DEFAULT_LOCALE)

  /**
   * @param {BonsaiEditorOptions} options
   */
  constructor(options) {
    if (!options?.element) {
      throw new Error('BonsaiEditor: "element" is required.')
    }

    const format = options.outputFormat ?? 'html'
    assertOutputFormat(format)
    this.#outputFormat = format
    this.#locale = resolveLocale(options.locale)
    this.#t = createTranslator(this.#locale)

    if (options.injectStyles) {
      if (options.injectStylesCss) {
        injectBonsaiStyles(options.injectStylesCss)
      }
    }

    this.#rootEl = options.element
    this.#rootEl.classList.add('bonsai-editor')

    this.#mountEl = document.createElement('div')
    this.#mountEl.className = 'bonsai-editor__content'

    const menubarMenus = resolveMenubarMenus(options.menubar)
    if (menubarMenus) {
      const menubarEl = document.createElement('div')
      menubarEl.className = 'bonsai-editor__menubar-host'
      this.#rootEl.appendChild(menubarEl)
      this.#menubar = new BonsaiMenubar(this, { element: menubarEl, menus: menubarMenus })
    }

    const toolbarItems = resolveToolbarItems(options.toolbar)

    const fileManagerWanted =
      options.fileManager !== false &&
      (options.fileManager === true ||
        (typeof options.fileManager === 'object' && options.fileManager !== null) ||
        toolbarItems?.has('fileManager'))

    if (fileManagerWanted) {
      const fmOptions = typeof options.fileManager === 'object' ? options.fileManager : {}
      this.#fileManager = new FileManager(this, fmOptions)
    }

    if (toolbarItems) {
      const toolbarEl = document.createElement('div')
      toolbarEl.className = 'bonsai-editor__toolbar-host'
      this.#rootEl.appendChild(toolbarEl)
      this.#toolbar = new BonsaiToolbar(this, { element: toolbarEl, items: toolbarItems })
    }

    this.#rootEl.appendChild(this.#mountEl)

    this.#sourceView = new SourceView(this, this.#rootEl, this.#mountEl)
    this.#fullscreen = new FullscreenController(this.#rootEl, () => {
      this.#toolbar?.sync()
      this.#menubar?.sync()
      this.#emit('fullscreenChange', this.isFullscreen)
    })

    const extensions = createExtensions(options.features, {
      placeholder: options.placeholder,
      extensions: options.extensions,
    })

    const ariaLabel = options.ariaLabel ?? this.#t('editor.ariaLabel')

    this.#tiptap = new Editor({
      element: this.#mountEl,
      extensions,
      content: options.content ?? '',
      editable: options.editable ?? true,
      autofocus: options.autofocus ?? false,
      editorProps: {
        attributes: {
          class: 'bonsai-editor__prosemirror',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': ariaLabel,
        },
      },
      onCreate: ({ editor }) => {
        options.onCreate?.(this)
        this.#emit('create', this)
        this.#menubar?.mount()
        if (this.#toolbar) {
          this.#toolbar.mount()
        }
        void editor
      },
      onUpdate: ({ editor }) => {
        const value = getOutputValue(editor, this.#outputFormat)
        options.onUpdate?.(value, this)
        this.#emit('update', value)
      },
      onFocus: ({ event }) => {
        options.onFocus?.(/** @type {FocusEvent} */ (event), this)
        this.#emit('focus', /** @type {FocusEvent} */ (event))
      },
      onBlur: ({ event }) => {
        options.onBlur?.(/** @type {FocusEvent} */ (event), this)
        this.#emit('blur', /** @type {FocusEvent} */ (event))
      },
      onSelectionUpdate: () => {
        options.onSelectionUpdate?.(this)
        this.#emit('selectionUpdate')
        this.syncChrome()
      },
      onTransaction: () => {
        this.syncChrome()
      },
      onDestroy: () => {
        options.onDestroy?.()
        this.#emit('destroy')
      },
    })

    this.#formatPainter = new FormatPainter(this)
  }

  get formatPainter() {
    return this.#formatPainter
  }

  /** @returns {FileManager | null} */
  get fileManager() {
    return this.#fileManager
  }

  syncChrome() {
    if (this.#destroyed || this.#tiptap?.isDestroyed) return
    this.#toolbar?.sync()
    this.#menubar?.sync()
  }

  /** @returns {OutputFormat} */
  get outputFormat() {
    return this.#outputFormat
  }

  /** @param {OutputFormat} format */
  set outputFormat(format) {
    assertOutputFormat(format)
    this.#outputFormat = format
    if (this.isSourceView) {
      this.#sourceView.enter()
    }
  }

  get isSourceView() {
    return this.#sourceView.isActive
  }

  get isFullscreen() {
    return this.#fullscreen.isFullscreen
  }

  get isFullscreenSupported() {
    return this.#fullscreen.isSupported
  }

  async toggleFullscreen() {
    if (this.#destroyed) return false
    const ok = await this.#fullscreen.toggle()
    return ok
  }

  /**
   * Váltás vizuális ↔ forráskód nézet között.
   * @returns {boolean} false, ha a forrás érvénytelen és nem lehet visszalépni
   */
  toggleSourceView() {
    if (this.#destroyed) return false
    if (this.isSourceView) {
      if (!this.#sourceView.exit(true)) return false
    } else {
      this.#sourceView.enter()
    }
    if (this.isSourceView) {
      this.#formatPainter.cancel()
    }
    this.syncChrome()
    this.#emit('sourceViewChange', this.isSourceView)
    return true
  }

  get tiptap() {
    if (!this.#tiptap || this.#destroyed) {
      throw new Error('BonsaiEditor: editor is destroyed.')
    }
    return this.#tiptap
  }

  get isDestroyed() {
    return this.#destroyed
  }

  /** @returns {HTMLElement} */
  get rootElement() {
    return this.#rootEl
  }

  get locale() {
    return this.#locale
  }

  /** @returns {import('../i18n/index.js').TranslateFn} */
  get t() {
    return this.#t
  }

  /**
   * @param {import('../i18n/index.js').BonsaiLocale | string} locale
   */
  setLocale(locale) {
    this.#locale = resolveLocale(locale)
    this.#t = createTranslator(this.#locale)
    this.#toolbar?.sync()
    this.#menubar?.sync()
    this.#fileManager?.syncLocale?.()
    this.#emit('localeChange', this.#locale)
  }

  getValue() {
    return getOutputValue(this.tiptap, this.#outputFormat)
  }

  /**
   * @param {OutputFormat} [format]
   */
  getContent(format) {
    const f = format ?? this.#outputFormat
    assertOutputFormat(f)
    return getOutputValue(this.tiptap, f)
  }

  getHTML() {
    return this.tiptap.getHTML()
  }

  /**
   * @param {PdfExportOptions} [options]
   * @returns {Promise<void>}
   */
  exportPdf(options = {}) {
    return exportHtmlAsPdf(this.getHTML(), options)
  }

  /**
   * @param {string} html
   * @param {WordImportApplyOptions} [options]
   */
  applyImportedWordHtml(html, options = {}) {
    const mode = options.mode ?? 'replace'
    if (mode === 'insert') {
      this.tiptap.chain().focus().insertContent(html).run()
      return
    }
    this.setContent(html, { emitUpdate: true })
  }

  /**
   * @param {File | Blob} file
   * @param {WordImportApplyOptions & { confirmReplace?: boolean }} [options]
   * @returns {Promise<WordImportOutcome>}
   */
  async importWord(file, options = {}) {
    const { html, messages } = await convertDocxFileToHtml(file)

    if (html === '<p></p>' || html === '<p><br></p>') {
      throw new Error(this.#t('error.wordEmpty'))
    }

    if (
      options.mode !== 'insert' &&
      options.confirmReplace !== false &&
      !this.isEmpty()
    ) {
      const ok = window.confirm(this.#t('error.wordConfirmReplace'))
      if (!ok) return { html, messages, cancelled: true }
    }

    this.applyImportedWordHtml(html, options)
    this.focus('end')
    return { html, messages }
  }

  /**
   * @param {WordImportApplyOptions & { confirmReplace?: boolean }} [options]
   * @returns {Promise<WordImportOutcome | null>}
   */
  async importWordFromPicker(options = {}) {
    const file = await pickDocxFile()
    if (!file) return null
    return this.importWord(file, options)
  }

  /**
   * @param {string} url
   * @param {{ title?: string }} [options]
   */
  insertMediaFromUrl(url, options = {}) {
    return insertMediaIntoEditor(this, url, options, this.#t)
  }

  getJSON() {
    return JSON.parse(JSON.stringify(this.tiptap.getJSON()))
  }

  getText() {
    return this.tiptap.getText()
  }

  isEmpty() {
    return this.tiptap.isEmpty
  }

  /**
   * @param {string | object} content
   * @param {{ emitUpdate?: boolean }} [opts]
   */
  setContent(content, { emitUpdate = false } = {}) {
    this.tiptap.commands.setContent(content, { emitUpdate })
  }

  /**
   * @param {boolean} editable
   */
  setEditable(editable) {
    this.tiptap.setEditable(editable)
    this.#rootEl.classList.toggle('bonsai-editor--readonly', !editable)
    this.#textareaEditable(editable)
  }

  /**
   * @param {boolean} editable
   */
  #textareaEditable(editable) {
    if (this.#sourceView) {
      const ta = this.#rootEl.querySelector('.bonsai-editor__source-textarea')
      if (ta instanceof HTMLTextAreaElement) ta.readOnly = !editable
    }
  }

  /**
   * @param {boolean | 'start' | 'end' | number | null} [position]
   */
  focus(position) {
    this.tiptap.commands.focus(position)
  }

  blur() {
    this.tiptap.commands.blur()
  }

  /**
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set())
    }
    this.#listeners.get(event)?.add(handler)
    return this
  }

  /**
   * @param {string} event
   * @param {Function} [handler]
   */
  off(event, handler) {
    if (!handler) {
      this.#listeners.delete(event)
      return this
    }
    this.#listeners.get(event)?.delete(handler)
    return this
  }

  /**
   * @param {string} event
   * @param {...unknown} args
   */
  #emit(event, ...args) {
    this.#listeners.get(event)?.forEach((fn) => fn(...args))
  }

  destroy() {
    if (this.#destroyed) return
    this.#destroyed = true
    this.#formatPainter?.destroy()
    this.#fileManager?.destroy()
    this.#fileManager = null
    this.#menubar?.destroy()
    this.#menubar = null
    this.#toolbar?.destroy()
    this.#toolbar = null
    this.#sourceView?.destroy()
    this.#fullscreen?.destroy()
    this.#tiptap?.destroy()
    this.#tiptap = null
    this.#listeners.clear()
    this.#mountEl.remove()
    this.#rootEl.querySelector('.bonsai-editor__menubar-host')?.remove()
    this.#rootEl.querySelector('.bonsai-editor__toolbar-host')?.remove()
    this.#rootEl.classList.remove('bonsai-editor', 'bonsai-editor--readonly')
  }
}
