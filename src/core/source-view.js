/**
 * @typedef {import('./editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {import('./output.js').OutputFormat} OutputFormat
 */

export class SourceView {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {HTMLElement} */
  #rootEl

  /** @type {HTMLElement} */
  #mountEl

  /** @type {HTMLElement} */
  #wrap

  /** @type {HTMLTextAreaElement} */
  #textarea

  /** @type {HTMLElement} */
  #errorEl

  /** @type {boolean} */
  #active = false

  /**
   * @param {BonsaiEditor} editor
   * @param {HTMLElement} rootEl
   * @param {HTMLElement} mountEl
   */
  constructor(editor, rootEl, mountEl) {
    this.#editor = editor
    this.#rootEl = rootEl
    this.#mountEl = mountEl

    this.#wrap = document.createElement('div')
    this.#wrap.className = 'bonsai-editor__source'
    this.#wrap.hidden = true

    this.#textarea = document.createElement('textarea')
    this.#textarea.className = 'bonsai-editor__source-textarea'
    this.#textarea.spellcheck = false
    this.#textarea.setAttribute('aria-label', 'Forráskód szerkesztő')

    this.#errorEl = document.createElement('div')
    this.#errorEl.className = 'bonsai-editor__source-error'
    this.#errorEl.hidden = true
    this.#errorEl.setAttribute('role', 'alert')

    this.#wrap.append(this.#textarea, this.#errorEl)
    this.#rootEl.appendChild(this.#wrap)

    this.#textarea.addEventListener('input', () => {
      this.#errorEl.hidden = true
    })
  }

  get isActive() {
    return this.#active
  }

  /** @param {OutputFormat} format */
  #labelForFormat(format) {
    return format === 'json' ? 'JSON forrás' : 'HTML forrás'
  }

  enter() {
    const format = this.#editor.outputFormat
    this.#textarea.value = this.#serialize(format)
    this.#textarea.setAttribute('aria-label', this.#labelForFormat(format))
    this.#errorEl.hidden = true
    this.#mountEl.hidden = true
    this.#wrap.hidden = false
    this.#rootEl.classList.add('bonsai-editor--source')
    this.#active = true
    this.#textarea.focus()
  }

  /**
   * @param {boolean} [apply]
   * @returns {boolean} sikeres kilépés
   */
  exit(apply = true) {
    if (apply) {
      const parsed = this.#parse(this.#textarea.value, this.#editor.outputFormat)
      if (!parsed.ok) {
        this.#errorEl.textContent = parsed.error
        this.#errorEl.hidden = false
        return false
      }
      this.#editor.setContent(parsed.content, { emitUpdate: true })
    }

    this.#wrap.hidden = true
    this.#mountEl.hidden = false
    this.#rootEl.classList.remove('bonsai-editor--source')
    this.#active = false
    return true
  }

  /** @param {OutputFormat} format */
  #serialize(format) {
    if (format === 'json') {
      return JSON.stringify(this.#editor.getJSON(), null, 2)
    }
    return this.#editor.getHTML()
  }

  /**
   * @param {string} raw
   * @param {OutputFormat} format
   */
  #parse(raw, format) {
    if (format === 'json') {
      const trimmed = raw.trim()
      if (!trimmed) {
        return { ok: true, content: { type: 'doc', content: [{ type: 'paragraph' }] } }
      }
      try {
        const content = JSON.parse(trimmed)
        if (!content || typeof content !== 'object') {
          return { ok: false, error: 'A JSON gyökere objektum kell legyen.' }
        }
        return { ok: true, content }
      } catch {
        return { ok: false, error: 'Érvénytelen JSON szintaxis.' }
      }
    }
    return { ok: true, content: raw }
  }

  destroy() {
    this.#wrap.remove()
  }
}
