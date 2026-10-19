import { createToolbarIcon } from './icons.js'
import {
  detectMediaKind,
  mediaKindLabel,
  normalizeMediaUrl,
} from '../core/media-url-utils.js'
import { insertMediaIntoEditor } from '../core/insert-media.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 */

export class MediaInsertControl {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {HTMLElement} */
  #root

  /** @type {HTMLButtonElement} */
  #trigger

  /** @type {HTMLElement} */
  #panel

  /** @type {HTMLInputElement} */
  #urlInput

  /** @type {HTMLInputElement} */
  #titleInput

  /** @type {HTMLElement} */
  #hint

  /** @type {HTMLElement} */
  #titleEl

  /** @type {HTMLElement} */
  #urlLabel

  /** @type {HTMLElement} */
  #optionalTitleLabel

  /** @type {HTMLButtonElement} */
  #insertBtn

  /** @type {(e: MouseEvent) => void} */
  #onDocClick

  /**
   * @param {BonsaiEditor} editor
   */
  constructor(editor) {
    this.#editor = editor

    this.#root = document.createElement('div')
    this.#root.className = 'bonsai-editor__metric-control bonsai-editor__media-control'

    this.#trigger = document.createElement('button')
    this.#trigger.type = 'button'
    this.#trigger.className = 'bonsai-editor__metric-trigger'
    this.#trigger.setAttribute('aria-haspopup', 'dialog')
    this.#trigger.setAttribute('aria-expanded', 'false')

    const icon = createToolbarIcon('insertMedia')
    if (icon) this.#trigger.appendChild(icon)

    this.#panel = document.createElement('div')
    this.#panel.className = 'bonsai-editor__metric-panel bonsai-editor__media-panel'
    this.#panel.hidden = true
    this.#panel.setAttribute('role', 'dialog')
    this.#titleEl = document.createElement('p')
    this.#titleEl.className = 'bonsai-editor__table-panel-title'

    const urlField = this.#field('https://…', 'url')
    this.#urlInput = urlField.input
    this.#urlLabel = urlField.labelEl

    const titleField = this.#field('', 'text')
    this.#titleInput = titleField.input
    this.#optionalTitleLabel = titleField.labelEl

    this.#hint = document.createElement('p')
    this.#hint.className = 'bonsai-editor__media-hint'

    this.#insertBtn = document.createElement('button')
    this.#insertBtn.type = 'button'
    this.#insertBtn.className = 'bonsai-editor__metric-reset bonsai-editor__table-insert-btn'
    this.#insertBtn.addEventListener('click', () => this.#insert())

    this.#panel.append(
      this.#titleEl,
      this.#urlInput.closest('.bonsai-editor__metric-field'),
      this.#titleInput.closest('.bonsai-editor__metric-field'),
      this.#hint,
      this.#insertBtn,
    )
    this.refreshLocale()

    this.#urlInput.addEventListener('input', () => this.#syncHint())
    this.#urlInput.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        e.preventDefault()
        this.#insert()
      }
    })
    this.#titleInput.addEventListener('keydown', (e) => e.stopPropagation())

    this.#trigger.addEventListener('mousedown', (e) => e.preventDefault())
    this.#trigger.addEventListener('click', () => this.#togglePanel())

    this.#onDocClick = (e) => {
      if (!this.#root.contains(/** @type {Node} */ (e.target))) this.#closePanel()
    }

    this.#root.append(this.#trigger, this.#panel)
  }

  /** @returns {HTMLElement} */
  get element() {
    return this.#root
  }

  refreshLocale() {
    const t = this.#editor.t
    this.#trigger.setAttribute('aria-label', t('media.aria'))
    this.#trigger.title = t('media.aria')
    this.#panel.setAttribute('aria-label', t('media.aria'))
    this.#titleEl.textContent = t('media.title')
    this.#urlLabel.textContent = t('media.url')
    this.#optionalTitleLabel.textContent = t('media.optionalTitle')
    this.#titleInput.placeholder = t('media.titlePlaceholder')
    this.#insertBtn.textContent = t('media.insert')
    this.#syncHint()
  }

  sync() {
    // nincs aktív állapot
  }

  destroy() {
    document.removeEventListener('mousedown', this.#onDocClick)
    this.#closePanel()
  }

  /**
   * @param {string} placeholder
   * @param {string} type
   */
  #field(placeholder, type) {
    const field = document.createElement('div')
    field.className = 'bonsai-editor__metric-field'

    const fieldLabel = document.createElement('span')
    fieldLabel.className = 'bonsai-editor__metric-field-label'

    const input = document.createElement('input')
    input.type = type
    input.className = 'bonsai-editor__metric-input'
    input.placeholder = placeholder
    input.autocomplete = 'off'

    field.append(fieldLabel, input)
    return { input, labelEl: fieldLabel }
  }

  #syncHint() {
    const t = this.#editor.t
    const url = normalizeMediaUrl(this.#urlInput.value)
    const kind = url ? detectMediaKind(url) : null
    this.#hint.textContent = kind
      ? t('media.detected', { type: mediaKindLabel(kind, t) })
      : t('media.hint')
  }

  #insert() {
    try {
      insertMediaIntoEditor(this.#editor, this.#urlInput.value, {
        title: this.#titleInput.value,
      })
      this.#urlInput.value = ''
      this.#titleInput.value = ''
      this.#syncHint()
      this.#closePanel()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      window.alert(message)
    }
  }

  #togglePanel() {
    if (this.#panel.hidden) {
      this.#panel.hidden = false
      this.#trigger.setAttribute('aria-expanded', 'true')
      document.addEventListener('mousedown', this.#onDocClick)
      this.#urlInput.focus()
      this.#urlInput.select()
    } else {
      this.#closePanel()
    }
  }

  #closePanel() {
    this.#panel.hidden = true
    this.#trigger.setAttribute('aria-expanded', 'false')
    document.removeEventListener('mousedown', this.#onDocClick)
  }
}

/**
 * @param {BonsaiEditor} editor
 */
export function createMediaInsertControl(editor) {
  return new MediaInsertControl(editor)
}
