import { createToolbarIcon } from './icons.js'
import { HeadingDropdown } from './heading-dropdown.js'
import { FontFamilyDropdown } from './font-family-dropdown.js'
import { createLetterSpacingControl, createLineHeightControl } from './text-metric-control.js'
import { createTextBackgroundControl, createTextColorControl } from './text-color-control.js'
import { createTableInsertControl } from './table-insert-control.js'
import { createMediaInsertControl } from './media-insert-control.js'
import { buildToolbarMountPlan } from './toolbar-config.js'
import { getEditorAction } from './editor-actions.js'
import { runEditorAction } from './run-editor-action.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {import('./toolbar-config.js').ToolbarItemId} ToolbarItemId
 */

export class BonsaiToolbar {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {HTMLElement} */
  #element

  /** @type {HTMLElement | null} */
  #bar = null

  /** @type {Set<ToolbarItemId>} */
  #enabled

  /** @type {HTMLButtonElement[]} */
  #buttons = []

  /** @type {HeadingDropdown | null} */
  #headingDropdown = null

  /** @type {FontFamilyDropdown | null} */
  #fontFamilyDropdown = null

  /** @type {import('./text-metric-control.js').TextMetricControl | null} */
  #letterSpacingDropdown = null

  /** @type {import('./text-metric-control.js').TextMetricControl | null} */
  #lineHeightDropdown = null

  /** @type {import('./text-color-control.js').TextColorControl | null} */
  #textColorControl = null

  /** @type {import('./text-color-control.js').TextColorControl | null} */
  #textBackgroundControl = null

  /** @type {import('./table-insert-control.js').TableInsertControl | null} */
  #tableInsertControl = null

  /** @type {import('./media-insert-control.js').MediaInsertControl | null} */
  #mediaInsertControl = null

  /** @type {(() => void) | null} */
  #onSelection = null

  /**
   * @param {BonsaiEditor} editor
   * @param {{ element: HTMLElement; items: Set<ToolbarItemId> }} options
   */
  constructor(editor, options) {
    this.#editor = editor
    this.#element = options.element
    this.#enabled = options.items
  }

  mount() {
    const bar = document.createElement('div')
    bar.className = 'bonsai-editor__toolbar'
    bar.setAttribute('role', 'toolbar')
    bar.setAttribute('aria-label', this.#editor.t('toolbar.ariaLabel'))

    if (this.#enabled.has('heading')) {
      this.#headingDropdown = new HeadingDropdown(this.#editor)
    }

    if (this.#enabled.has('fontFamily')) {
      this.#fontFamilyDropdown = new FontFamilyDropdown(this.#editor)
    }

    if (this.#enabled.has('letterSpacing')) {
      this.#letterSpacingDropdown = createLetterSpacingControl(this.#editor)
    }

    if (this.#enabled.has('lineHeight')) {
      this.#lineHeightDropdown = createLineHeightControl(this.#editor)
    }

    if (this.#enabled.has('textColor')) {
      this.#textColorControl = createTextColorControl(this.#editor)
    }

    if (this.#enabled.has('textBackground')) {
      this.#textBackgroundControl = createTextBackgroundControl(this.#editor)
    }

    if (this.#enabled.has('insertTable')) {
      this.#tableInsertControl = createTableInsertControl(this.#editor)
    }

    if (this.#enabled.has('insertMedia')) {
      this.#mediaInsertControl = createMediaInsertControl(this.#editor)
    }

    const plan = buildToolbarMountPlan(this.#enabled)

    for (const entry of plan) {
      if (entry.kind === 'sep') {
        const sep = document.createElement('span')
        sep.className = 'bonsai-editor__toolbar-separator'
        sep.setAttribute('aria-hidden', 'true')
        bar.appendChild(sep)
        continue
      }

      if (entry.kind === 'heading' && this.#headingDropdown) {
        bar.appendChild(this.#headingDropdown.element)
        continue
      }

      if (entry.kind === 'fontFamily' && this.#fontFamilyDropdown) {
        bar.appendChild(this.#fontFamilyDropdown.element)
        continue
      }

      if (entry.kind === 'letterSpacing' && this.#letterSpacingDropdown) {
        bar.appendChild(this.#letterSpacingDropdown.element)
        continue
      }

      if (entry.kind === 'lineHeight' && this.#lineHeightDropdown) {
        bar.appendChild(this.#lineHeightDropdown.element)
        continue
      }

      if (entry.kind === 'textColor' && this.#textColorControl) {
        bar.appendChild(this.#textColorControl.element)
        continue
      }

      if (entry.kind === 'textBackground' && this.#textBackgroundControl) {
        bar.appendChild(this.#textBackgroundControl.element)
        continue
      }

      if (entry.kind === 'insertTable' && this.#tableInsertControl) {
        bar.appendChild(this.#tableInsertControl.element)
        continue
      }

      if (entry.kind === 'insertMedia' && this.#mediaInsertControl) {
        bar.appendChild(this.#mediaInsertControl.element)
        continue
      }

      if (entry.kind === 'button' && entry.id) {
        const def = getEditorAction(entry.id, this.#editor.t)
        if (!def) continue

        const btn = document.createElement('button')
        btn.type = 'button'
        btn.dataset.action = entry.id
        btn.setAttribute('aria-label', def.label)
        btn.setAttribute('title', def.label)
        const icon = createToolbarIcon(entry.id)
        if (icon) {
          btn.replaceChildren(icon)
        }
        // Megtartja a fókuszt és a kijelölést — stored mark gombok aktív állapota látszik.
        btn.addEventListener('mousedown', (e) => e.preventDefault())
        if (entry.id === 'formatPainter') {
          /** @type {ReturnType<typeof setTimeout> | null} */
          let clickTimer = null
          btn.addEventListener('click', (ev) => {
            ev.preventDefault()
            clickTimer = setTimeout(() => {
              clickTimer = null
              def.run(this.#editor)
              this.#syncState()
            }, 220)
          })
          btn.addEventListener('dblclick', (ev) => {
            ev.preventDefault()
            if (clickTimer) {
              clearTimeout(clickTimer)
              clickTimer = null
            }
            this.#editor.formatPainter.copyAndArm({ sticky: true })
            this.#syncState()
          })
        } else {
          btn.addEventListener('click', (ev) => {
            ev.preventDefault()
            void runEditorAction(this.#editor, def).finally(() => this.#syncState())
          })
        }
        bar.appendChild(btn)
        this.#buttons.push(btn)
      }
    }

    this.#element.appendChild(bar)
    this.#bar = bar

    this.#onSelection = () => this.#syncState()
    this.#editor.on('selectionUpdate', this.#onSelection)
    this.#editor.on('update', this.#onSelection)
    this.#syncState()
  }

  sync() {
    this.#syncState()
  }

  #syncState() {
    if (this.#editor.isDestroyed) return
    const sourceMode = this.#editor.isSourceView
    this.#bar?.setAttribute('aria-label', this.#editor.t('toolbar.ariaLabel'))
    this.#headingDropdown?.sync()
    this.#headingDropdown?.refreshLocale?.()
    this.#headingDropdown?.element.classList.toggle('is-disabled', sourceMode)
    this.#fontFamilyDropdown?.sync()
    this.#fontFamilyDropdown?.element.classList.toggle('is-disabled', sourceMode)
    this.#letterSpacingDropdown?.sync()
    this.#letterSpacingDropdown?.element.classList.toggle('is-disabled', sourceMode)
    this.#lineHeightDropdown?.sync()
    this.#lineHeightDropdown?.element.classList.toggle('is-disabled', sourceMode)
    this.#textColorControl?.sync()
    this.#textColorControl?.element.classList.toggle('is-disabled', sourceMode)
    this.#textBackgroundControl?.sync()
    this.#textBackgroundControl?.element.classList.toggle('is-disabled', sourceMode)
    this.#textColorControl?.refreshLocale?.()
    this.#textBackgroundControl?.refreshLocale?.()
    this.#letterSpacingDropdown?.refreshLocale?.()
    this.#lineHeightDropdown?.refreshLocale?.()
    this.#tableInsertControl?.refreshLocale?.()
    this.#mediaInsertControl?.refreshLocale?.()
    this.#tableInsertControl?.sync()
    this.#tableInsertControl?.element.classList.toggle('is-disabled', sourceMode)
    this.#mediaInsertControl?.sync()
    this.#mediaInsertControl?.element.classList.toggle('is-disabled', sourceMode)

    for (const btn of this.#buttons) {
      const id = /** @type {ToolbarItemId} */ (btn.dataset.action)
      const def = getEditorAction(id, this.#editor.t)
      if (!def) continue
      const isSourceBtn = id === 'sourceCode'
      const isFullscreenBtn = id === 'fullscreen'
      const isFormatPainterBtn = id === 'formatPainter'
      const isFileManagerBtn = id === 'fileManager'

      if (!isFormatPainterBtn && !isFullscreenBtn) {
        btn.setAttribute('aria-label', def.label)
        btn.setAttribute('title', def.label)
      }

      if (isFormatPainterBtn) {
        const armed = this.#editor.formatPainter.isArmed
        const sticky = this.#editor.formatPainter.isSticky
        const t = this.#editor.t
        const label = armed
          ? sticky
            ? t('formatPainter.armedSticky')
            : t('formatPainter.armedOnce')
          : t('formatPainter.idle')
        btn.setAttribute('aria-label', label)
        btn.setAttribute('title', label)
      }

      if (isFullscreenBtn) {
        const active = this.#editor.isFullscreen
        const label = active ? this.#editor.t('fullscreen.exit') : this.#editor.t('fullscreen.enter')
        btn.setAttribute('aria-label', label)
        btn.setAttribute('title', label)
        const icon = createToolbarIcon(active ? 'fullscreenExit' : 'fullscreen')
        if (icon) btn.replaceChildren(icon)
        btn.disabled = !this.#editor.isFullscreenSupported
      }

      btn.setAttribute('aria-pressed', def.isActive?.(this.#editor) ? 'true' : 'false')
      btn.classList.toggle('is-active', !!def.isActive?.(this.#editor))
      if (isFileManagerBtn) {
        btn.setAttribute('aria-expanded', def.isActive?.(this.#editor) ? 'true' : 'false')
      }

      if (sourceMode && !isSourceBtn && !isFullscreenBtn) {
        btn.disabled = true
      } else if (!isFullscreenBtn) {
        btn.disabled = def.canRun ? !def.canRun(this.#editor) : false
      }
    }
  }

  destroy() {
    if (this.#onSelection) {
      this.#editor.off('selectionUpdate', this.#onSelection)
      this.#editor.off('update', this.#onSelection)
    }
    this.#headingDropdown?.destroy()
    this.#headingDropdown = null
    this.#fontFamilyDropdown?.destroy()
    this.#fontFamilyDropdown = null
    this.#letterSpacingDropdown?.destroy()
    this.#letterSpacingDropdown = null
    this.#lineHeightDropdown?.destroy()
    this.#lineHeightDropdown = null
    this.#textColorControl?.destroy()
    this.#textColorControl = null
    this.#textBackgroundControl?.destroy()
    this.#textBackgroundControl = null
    this.#tableInsertControl?.destroy()
    this.#tableInsertControl = null
    this.#mediaInsertControl?.destroy()
    this.#mediaInsertControl = null
    this.#element.innerHTML = ''
  }
}
