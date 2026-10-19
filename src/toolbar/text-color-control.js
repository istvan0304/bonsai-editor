import { createToolbarIcon } from './icons.js'
import {
  cssColorToHex,
  getActiveTextBackgroundColor,
  getActiveTextColor,
  normalizeHexColor,
} from '../core/text-color-utils.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {'textColor' | 'textBackground'} TextColorKind
 */

/** @type {Record<TextColorKind, { iconId: string; ariaLabel: string; presets: string[] }>} */
const COLOR_CONFIG = {
  textColor: {
    iconId: 'textColor',
    ariaLabel: 'Betűszín',
    presets: ['#0f172a', '#dc2626', '#2563eb', '#059669', '#9333ea', '#ea580c'],
  },
  textBackground: {
    iconId: 'textBackground',
    ariaLabel: 'Betű háttérszín',
    presets: ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecdd3', '#e2e8f0', '#ffffff'],
  },
}

export class TextColorControl {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {TextColorKind} */
  #kind

  /** @type {HTMLElement} */
  #root

  /** @type {HTMLButtonElement} */
  #trigger

  /** @type {HTMLElement} */
  #indicator

  /** @type {HTMLElement} */
  #panel

  /** @type {HTMLInputElement} */
  #picker

  /** @type {HTMLInputElement} */
  #hexInput

  /** @type {HTMLElement} */
  #pickerLabelEl

  /** @type {HTMLElement} */
  #hexLabelEl

  /** @type {HTMLButtonElement} */
  #resetBtn

  /** @type {(e: MouseEvent) => void} */
  #onDocClick

  /**
   * @param {BonsaiEditor} editor
   * @param {TextColorKind} kind
   */
  constructor(editor, kind) {
    this.#editor = editor
    this.#kind = kind
    const config = COLOR_CONFIG[kind]

    this.#root = document.createElement('div')
    this.#root.className = 'bonsai-editor__metric-control bonsai-editor__color-control'
    this.#root.dataset.colorKind = kind

    this.#trigger = document.createElement('button')
    this.#trigger.type = 'button'
    this.#trigger.className = 'bonsai-editor__metric-trigger bonsai-editor__color-trigger'
    this.#trigger.setAttribute('aria-haspopup', 'dialog')
    this.#trigger.setAttribute('aria-expanded', 'false')
    const icon = createToolbarIcon(config.iconId)
    if (icon) this.#trigger.appendChild(icon)

    this.#indicator = document.createElement('span')
    this.#indicator.className = 'bonsai-editor__color-indicator'
    this.#indicator.setAttribute('aria-hidden', 'true')
    this.#trigger.appendChild(this.#indicator)

    this.#panel = document.createElement('div')
    this.#panel.className = 'bonsai-editor__metric-panel bonsai-editor__color-panel'
    this.#panel.hidden = true
    this.#panel.setAttribute('role', 'dialog')

    const presets = document.createElement('div')
    presets.className = 'bonsai-editor__color-presets'
    presets.setAttribute('role', 'listbox')
    for (const hex of config.presets) {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.className = 'bonsai-editor__color-preset'
      swatch.style.backgroundColor = hex
      swatch.title = hex
      swatch.setAttribute('aria-label', hex)
      swatch.addEventListener('click', (e) => {
        e.preventDefault()
        this.#applyHex(hex)
        this.#closePanel()
      })
      presets.appendChild(swatch)
    }

    const pickerRow = document.createElement('label')
    pickerRow.className = 'bonsai-editor__color-picker-row'
    this.#pickerLabelEl = document.createElement('span')
    this.#picker = document.createElement('input')
    this.#picker.type = 'color'
    this.#picker.className = 'bonsai-editor__color-picker'
    this.#picker.value = '#000000'
    pickerRow.append(this.#pickerLabelEl, this.#picker)

    const hexRow = document.createElement('label')
    hexRow.className = 'bonsai-editor__metric-field bonsai-editor__color-hex-row'
    this.#hexLabelEl = document.createElement('span')
    this.#hexLabelEl.className = 'bonsai-editor__metric-field-label'
    this.#hexInput = document.createElement('input')
    this.#hexInput.type = 'text'
    this.#hexInput.className = 'bonsai-editor__metric-input bonsai-editor__color-hex-input'
    this.#hexInput.placeholder = '#000000'
    this.#hexInput.spellcheck = false
    hexRow.append(this.#hexLabelEl, this.#hexInput)

    this.#resetBtn = document.createElement('button')
    this.#resetBtn.type = 'button'
    this.#resetBtn.className = 'bonsai-editor__metric-reset'
    this.#resetBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this.#applyHex(null)
      this.#closePanel()
    })

    this.#panel.append(presets, pickerRow, hexRow, this.#resetBtn)
    this.refreshLocale()

    this.#trigger.addEventListener('mousedown', (e) => e.preventDefault())
    this.#trigger.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.#togglePanel()
    })

    this.#picker.addEventListener('input', () => {
      this.#applyHex(this.#picker.value)
    })
    this.#hexInput.addEventListener('keydown', (e) => e.stopPropagation())
    this.#hexInput.addEventListener('change', () => {
      const hex = normalizeHexColor(this.#hexInput.value)
      if (hex) this.#applyHex(hex)
    })

    this.#onDocClick = (e) => {
      if (!this.#root.contains(/** @type {Node} */ (e.target))) this.#closePanel()
    }

    this.#root.append(this.#trigger, this.#panel)
    this.sync()
  }

  get element() {
    return this.#root
  }

  #colorLabel() {
    const key = this.#kind === 'textColor' ? 'color.textColor' : 'color.textBackground'
    return this.#editor.t(key)
  }

  #applyTriggerLabels() {
    const label = this.#colorLabel()
    this.#trigger.setAttribute('aria-label', label)
    this.#trigger.title = label
  }

  refreshLocale() {
    this.#applyTriggerLabels()
    this.#panel.setAttribute('aria-label', this.#editor.t('color.panelText', { label: this.#colorLabel() }))
    this.#pickerLabelEl.textContent = this.#editor.t('metric.colorLabel')
    this.#hexLabelEl.textContent = this.#editor.t('metric.hexLabel')
    this.#resetBtn.textContent = this.#editor.t('metric.reset')
  }

  /**
   * @param {string | null} hex
   */
  #applyHex(hex) {
    const chain = this.#editor.tiptap.chain().focus()
    if (this.#kind === 'textColor') {
      if (hex) chain.setColor(hex).run()
      else chain.unsetColor().run()
    } else if (hex) {
      chain.setBackgroundColor(hex).run()
    } else {
      chain.unsetBackgroundColor().run()
    }
    this.sync()
  }

  #togglePanel() {
    if (this.#panel.hidden) this.#openPanel()
    else this.#closePanel()
  }

  #openPanel() {
    this.sync()
    this.#panel.hidden = false
    this.#trigger.setAttribute('aria-expanded', 'true')
    document.addEventListener('click', this.#onDocClick)
  }

  #closePanel() {
    this.#panel.hidden = true
    this.#trigger.setAttribute('aria-expanded', 'false')
    document.removeEventListener('click', this.#onDocClick)
  }

  sync() {
    if (this.#editor.isDestroyed) return
    const raw =
      this.#kind === 'textColor'
        ? getActiveTextColor(this.#editor.tiptap)
        : getActiveTextBackgroundColor(this.#editor.tiptap)
    const hex = cssColorToHex(raw)
    const active = Boolean(hex)

    this.#trigger.classList.toggle('is-active', active)
    this.#trigger.setAttribute('aria-pressed', active ? 'true' : 'false')

    if (hex) {
      this.#indicator.style.backgroundColor = hex
      this.#indicator.style.boxShadow = 'inset 0 0 0 1px rgb(15 23 42 / 12%)'
      this.#picker.value = hex
      this.#hexInput.value = hex
    } else {
      this.#indicator.style.backgroundColor = 'transparent'
      this.#indicator.style.boxShadow = 'inset 0 0 0 1px #cbd5e1'
      this.#hexInput.value = ''
    }
  }

  destroy() {
    this.#closePanel()
  }
}

/** @param {BonsaiEditor} editor */
export function createTextColorControl(editor) {
  return new TextColorControl(editor, 'textColor')
}

/** @param {BonsaiEditor} editor */
export function createTextBackgroundControl(editor) {
  return new TextColorControl(editor, 'textBackground')
}
