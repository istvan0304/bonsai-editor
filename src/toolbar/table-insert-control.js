import { createToolbarIcon } from './icons.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 */

const MIN_DIM = 1
const MAX_DIM = 20
const DEFAULT_ROWS = 3
const DEFAULT_COLS = 3

/**
 * @param {number} value
 * @param {number} fallback
 */
function clampDimension(value, fallback) {
  const n = Number.parseInt(String(value), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(MAX_DIM, Math.max(MIN_DIM, n))
}

export class TableInsertControl {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {HTMLElement} */
  #root

  /** @type {HTMLButtonElement} */
  #trigger

  /** @type {HTMLElement} */
  #panel

  /** @type {HTMLInputElement} */
  #rowsInput

  /** @type {HTMLInputElement} */
  #colsInput

  /** @type {HTMLInputElement} */
  #headerInput

  /** @type {HTMLElement} */
  #tableActions

  /** @type {HTMLElement} */
  #insertTitle

  /** @type {HTMLElement} */
  #rowsLabel

  /** @type {HTMLElement} */
  #colsLabel

  /** @type {HTMLLabelElement} */
  #headerLabel

  /** @type {HTMLElement} */
  #headerText

  /** @type {HTMLButtonElement} */
  #insertBtn

  /** @type {HTMLElement} */
  #actionsTitle

  /** @type {HTMLButtonElement[]} */
  #actionButtons = []

  /** @type {(e: MouseEvent) => void} */
  #onDocClick

  /**
   * @param {BonsaiEditor} editor
   */
  constructor(editor) {
    this.#editor = editor

    this.#root = document.createElement('div')
    this.#root.className = 'bonsai-editor__metric-control bonsai-editor__table-control'

    this.#trigger = document.createElement('button')
    this.#trigger.type = 'button'
    this.#trigger.className = 'bonsai-editor__metric-trigger'
    this.#trigger.setAttribute('aria-haspopup', 'dialog')
    this.#trigger.setAttribute('aria-expanded', 'false')

    const icon = createToolbarIcon('insertTable')
    if (icon) this.#trigger.appendChild(icon)

    this.#panel = document.createElement('div')
    this.#panel.className = 'bonsai-editor__metric-panel bonsai-editor__table-panel'
    this.#panel.hidden = true
    this.#panel.setAttribute('role', 'dialog')
    this.#insertTitle = document.createElement('p')
    this.#insertTitle.className = 'bonsai-editor__table-panel-title'

    const rowsField = this.#createNumberField(DEFAULT_ROWS)
    this.#rowsInput = rowsField.input
    this.#rowsLabel = rowsField.labelEl

    const colsField = this.#createNumberField(DEFAULT_COLS)
    this.#colsInput = colsField.input
    this.#colsLabel = colsField.labelEl

    this.#headerLabel = document.createElement('label')
    this.#headerLabel.className = 'bonsai-editor__table-check'
    this.#headerInput = document.createElement('input')
    this.#headerInput.type = 'checkbox'
    this.#headerInput.checked = true
    this.#headerText = document.createElement('span')
    this.#headerLabel.append(this.#headerInput, this.#headerText)

    this.#insertBtn = document.createElement('button')
    this.#insertBtn.type = 'button'
    this.#insertBtn.className = 'bonsai-editor__metric-reset bonsai-editor__table-insert-btn'
    this.#insertBtn.addEventListener('click', () => this.#insertTable())

    this.#tableActions = document.createElement('div')
    this.#tableActions.className = 'bonsai-editor__table-actions'
    this.#tableActions.hidden = true

    this.#actionsTitle = document.createElement('p')
    this.#actionsTitle.className = 'bonsai-editor__table-panel-title'

    const actionGrid = document.createElement('div')
    actionGrid.className = 'bonsai-editor__table-action-grid'
    for (const { i18nKey, run } of TABLE_ACTIONS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'bonsai-editor__table-action'
      btn.dataset.tableAction = i18nKey
      btn.addEventListener('click', () => {
        run(this.#editor)
        this.#syncPanelMode()
      })
      actionGrid.appendChild(btn)
      this.#actionButtons.push(btn)
    }

    this.#tableActions.append(this.#actionsTitle, actionGrid)

    this.#panel.append(
      this.#insertTitle,
      this.#rowsInput.closest('.bonsai-editor__metric-field'),
      this.#colsInput.closest('.bonsai-editor__metric-field'),
      this.#headerLabel,
      this.#insertBtn,
      this.#tableActions,
    )
    this.refreshLocale()

    this.#root.append(this.#trigger, this.#panel)

    this.#trigger.addEventListener('mousedown', (e) => e.preventDefault())
    this.#trigger.addEventListener('click', () => this.#togglePanel())

    this.#onDocClick = (e) => {
      if (!this.#root.contains(/** @type {Node} */ (e.target))) this.#closePanel()
    }
    document.addEventListener('mousedown', this.#onDocClick)
  }

  /** @returns {HTMLElement} */
  get element() {
    return this.#root
  }

  refreshLocale() {
    const t = this.#editor.t
    this.#trigger.setAttribute('aria-label', t('table.aria'))
    this.#trigger.title = t('table.aria')
    this.#panel.setAttribute('aria-label', t('table.panel'))
    this.#insertTitle.textContent = t('table.new')
    this.#rowsLabel.textContent = t('table.rows')
    this.#colsLabel.textContent = t('table.cols')
    this.#headerText.textContent = ` ${t('table.headerRow')}`
    this.#insertBtn.textContent = t('table.insert')
    this.#actionsTitle.textContent = t('table.edit')
    for (const btn of this.#actionButtons) {
      const key = btn.dataset.tableAction
      if (key) btn.textContent = t(key)
    }
  }

  sync() {
    if (this.#editor.isDestroyed) return
    const inTable = this.#editor.tiptap.isActive('table')
    this.#trigger.classList.toggle('is-active', inTable)
    this.#syncPanelMode()
  }

  destroy() {
    document.removeEventListener('mousedown', this.#onDocClick)
    this.#closePanel()
  }

  /**
   * @param {number} defaultValue
   */
  #createNumberField(defaultValue) {
    const field = document.createElement('div')
    field.className = 'bonsai-editor__metric-field'

    const fieldLabel = document.createElement('span')
    fieldLabel.className = 'bonsai-editor__metric-field-label'

    const input = document.createElement('input')
    input.type = 'number'
    input.className = 'bonsai-editor__metric-input'
    input.min = String(MIN_DIM)
    input.max = String(MAX_DIM)
    input.step = '1'
    input.value = String(defaultValue)

    field.append(fieldLabel, input)
    return { input, labelEl: fieldLabel }
  }

  #insertTable() {
    const rows = clampDimension(this.#rowsInput.value, DEFAULT_ROWS)
    const cols = clampDimension(this.#colsInput.value, DEFAULT_COLS)
    this.#rowsInput.value = String(rows)
    this.#colsInput.value = String(cols)

    this.#editor.tiptap
      .chain()
      .focus()
      .insertTable({
        rows,
        cols,
        withHeaderRow: this.#headerInput.checked,
      })
      .run()

    this.#closePanel()
  }

  #syncPanelMode() {
    if (this.#panel.hidden) return
    const inTable = this.#editor.tiptap.isActive('table')
    this.#tableActions.hidden = !inTable
  }

  #togglePanel() {
    if (this.#panel.hidden) {
      this.#panel.hidden = false
      this.#trigger.setAttribute('aria-expanded', 'true')
      this.#syncPanelMode()
      this.#rowsInput.focus()
      this.#rowsInput.select()
    } else {
      this.#closePanel()
    }
  }

  #closePanel() {
    this.#panel.hidden = true
    this.#trigger.setAttribute('aria-expanded', 'false')
  }
}

/** @type {Array<{ i18nKey: string; run: (editor: BonsaiEditor) => void }>} */
const TABLE_ACTIONS = [
  {
    i18nKey: 'table.rowAbove',
    run: (e) => {
      e.tiptap.chain().focus().addRowBefore().run()
    },
  },
  {
    i18nKey: 'table.rowBelow',
    run: (e) => {
      e.tiptap.chain().focus().addRowAfter().run()
    },
  },
  {
    i18nKey: 'table.deleteRow',
    run: (e) => {
      e.tiptap.chain().focus().deleteRow().run()
    },
  },
  {
    i18nKey: 'table.colLeft',
    run: (e) => {
      e.tiptap.chain().focus().addColumnBefore().run()
    },
  },
  {
    i18nKey: 'table.colRight',
    run: (e) => {
      e.tiptap.chain().focus().addColumnAfter().run()
    },
  },
  {
    i18nKey: 'table.deleteCol',
    run: (e) => {
      e.tiptap.chain().focus().deleteColumn().run()
    },
  },
  {
    i18nKey: 'table.deleteTable',
    run: (e) => {
      e.tiptap.chain().focus().deleteTable().run()
    },
  },
]

/**
 * @param {BonsaiEditor} editor
 */
export function createTableInsertControl(editor) {
  return new TableInsertControl(editor)
}
