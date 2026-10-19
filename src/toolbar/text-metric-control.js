import { createToolbarIcon } from './icons.js'
import {
  getActiveLetterSpacingRaw,
  getActiveLineHeightRaw,
  letterSpacingToNumber,
  lineHeightToNumber,
  numberToLetterSpacing,
  numberToLineHeight,
} from '../core/text-metric-utils.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {'letterSpacing' | 'lineHeight'} TextMetricKind
 */

/**
 * @typedef {{
 *   kind: TextMetricKind;
 *   iconId: string;
 *   ariaLabel: string;
 *   unitLabel: string;
 *   step: number;
 *   min: number;
 *   max: number;
 *   getRaw: (editor: import('@tiptap/core').Editor) => string | null;
 *   toNumber: (raw: string | null | undefined) => number | null;
 *   fromNumber: (value: number | null | undefined) => string | null;
 *   apply: (editor: BonsaiEditor, cssValue: string | null) => void;
 * }} TextMetricConfig
 */

/** @type {Record<TextMetricKind, TextMetricConfig>} */
/** @param {import('../i18n/index.js').TranslateFn} t @param {'letterSpacing' | 'lineHeight'} kind */
function metricAriaLabel(t, kind) {
  return kind === 'letterSpacing' ? t('metric.letterSpacing') : t('metric.lineHeight')
}

const METRIC_CONFIGS = {
  letterSpacing: {
    kind: 'letterSpacing',
    iconId: 'letterSpacing',
    ariaLabel: 'Térköz',
    unitLabel: 'em',
    step: 0.01,
    min: -0.5,
    max: 1,
    getRaw: getActiveLetterSpacingRaw,
    toNumber: letterSpacingToNumber,
    fromNumber: numberToLetterSpacing,
    apply: (editor, cssValue) => {
      const chain = editor.tiptap.chain().focus()
      if (cssValue) chain.setLetterSpacing(cssValue).run()
      else chain.unsetLetterSpacing().run()
    },
  },
  lineHeight: {
    kind: 'lineHeight',
    iconId: 'lineHeight',
    ariaLabel: 'Sorköz',
    unitLabel: '×',
    step: 0.1,
    min: 0.5,
    max: 4,
    getRaw: getActiveLineHeightRaw,
    toNumber: lineHeightToNumber,
    fromNumber: numberToLineHeight,
    apply: (editor, cssValue) => {
      const chain = editor.tiptap.chain().focus()
      if (cssValue) chain.setLineHeight(cssValue).run()
      else chain.unsetLineHeight().run()
    },
  },
}

export class TextMetricControl {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {TextMetricConfig} */
  #config

  /** @type {HTMLElement} */
  #root

  /** @type {HTMLButtonElement} */
  #trigger

  /** @type {HTMLElement} */
  #panel

  /** @type {HTMLInputElement} */
  #input

  /** @type {HTMLElement} */
  #valueLabelEl

  /** @type {HTMLButtonElement} */
  #resetBtn

  /** @type {(e: MouseEvent) => void} */
  #onDocClick

  /**
   * @param {BonsaiEditor} editor
   * @param {TextMetricKind} kind
   */
  constructor(editor, kind) {
    this.#editor = editor
    this.#config = METRIC_CONFIGS[kind]

    this.#root = document.createElement('div')
    this.#root.className = 'bonsai-editor__metric-control'
    this.#root.dataset.metric = kind

    this.#trigger = document.createElement('button')
    this.#trigger.type = 'button'
    this.#trigger.className = 'bonsai-editor__metric-trigger'
    this.#trigger.setAttribute('aria-haspopup', 'dialog')
    this.#trigger.setAttribute('aria-expanded', 'false')
    this.#applyTriggerLabels()

    const icon = createToolbarIcon(this.#config.iconId)
    if (icon) this.#trigger.appendChild(icon)

    this.#panel = document.createElement('div')
    this.#panel.className = 'bonsai-editor__metric-panel'
    this.#panel.hidden = true
    this.#panel.setAttribute('role', 'dialog')
    this.#applyPanelLabels()

    const label = document.createElement('label')
    label.className = 'bonsai-editor__metric-field'
    this.#valueLabelEl = document.createElement('span')
    this.#valueLabelEl.className = 'bonsai-editor__metric-field-label'

    this.#input = document.createElement('input')
    this.#input.type = 'number'
    this.#input.className = 'bonsai-editor__metric-input'
    this.#input.step = String(this.#config.step)
    this.#input.min = String(this.#config.min)
    this.#input.max = String(this.#config.max)
    this.#input.inputMode = 'decimal'
    this.#applyInputAria()

    const unit = document.createElement('span')
    unit.className = 'bonsai-editor__metric-unit'
    unit.textContent = this.#config.unitLabel

    label.append(this.#valueLabelEl, this.#input, unit)

    this.#resetBtn = document.createElement('button')
    this.#resetBtn.type = 'button'
    this.#resetBtn.className = 'bonsai-editor__metric-reset'
    this.#resetBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this.#input.value = ''
      this.#applyFromInput()
      this.#closePanel()
    })

    this.#panel.append(label, this.#resetBtn)
    this.refreshLocale()

    this.#trigger.addEventListener('mousedown', (e) => e.preventDefault())
    this.#trigger.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.#togglePanel()
    })

    this.#input.addEventListener('mousedown', (e) => e.stopPropagation())
    this.#input.addEventListener('click', (e) => e.stopPropagation())
    this.#input.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        e.preventDefault()
        this.#applyFromInput()
        this.#closePanel()
      }
    })
    this.#input.addEventListener('change', () => this.#applyFromInput())

    this.#onDocClick = (e) => {
      if (!this.#root.contains(/** @type {Node} */ (e.target))) this.#closePanel()
    }

    this.#root.append(this.#trigger, this.#panel)
    this.sync()
  }

  get element() {
    return this.#root
  }

  #applyTriggerLabels() {
    const aria = metricAriaLabel(this.#editor.t, this.#config.kind)
    this.#trigger.setAttribute('aria-label', aria)
    this.#trigger.title = aria
  }

  #applyPanelLabels() {
    const aria = metricAriaLabel(this.#editor.t, this.#config.kind)
    this.#panel.setAttribute('aria-label', this.#editor.t('metric.panel', { label: aria }))
  }

  #applyInputAria() {
    const aria = metricAriaLabel(this.#editor.t, this.#config.kind)
    this.#input.setAttribute('aria-label', `${aria} (${this.#config.unitLabel})`)
  }

  refreshLocale() {
    this.#applyTriggerLabels()
    this.#applyPanelLabels()
    this.#applyInputAria()
    this.#valueLabelEl.textContent = this.#editor.t('metric.value')
    this.#resetBtn.textContent = this.#editor.t('metric.reset')
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
    this.#input.focus()
    this.#input.select()
  }

  #closePanel() {
    this.#panel.hidden = true
    this.#trigger.setAttribute('aria-expanded', 'false')
    document.removeEventListener('click', this.#onDocClick)
  }

  #applyFromInput() {
    const raw = this.#input.value.trim()
    if (!raw) {
      this.#config.apply(this.#editor, null)
      this.sync()
      return
    }
    const num = Number.parseFloat(raw)
    if (!Number.isFinite(num)) return
    const clamped = Math.min(this.#config.max, Math.max(this.#config.min, num))
    const cssValue = this.#config.fromNumber(clamped)
    this.#config.apply(this.#editor, cssValue)
    this.sync()
  }

  sync() {
    if (this.#editor.isDestroyed) return
    const raw = this.#config.getRaw(this.#editor.tiptap)
    const num = this.#config.toNumber(raw)
    this.#input.value = num == null ? '' : String(num)
    const active = num != null
    this.#trigger.classList.toggle('is-active', active)
    this.#trigger.setAttribute('aria-pressed', active ? 'true' : 'false')
  }

  destroy() {
    this.#closePanel()
  }
}

/** @param {BonsaiEditor} editor */
export function createLetterSpacingControl(editor) {
  return new TextMetricControl(editor, 'letterSpacing')
}

/** @param {BonsaiEditor} editor */
export function createLineHeightControl(editor) {
  return new TextMetricControl(editor, 'lineHeight')
}
