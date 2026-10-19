import { createToolbarIcon } from './icons.js'
import { DEFAULT_FONT_FAMILIES, getActiveFontFamilyLabel, getActiveFontFamilyValue } from '../core/font-families.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {import('../core/font-families.js').FontFamilyChoice} FontFamilyChoice
 */

export class FontFamilyDropdown {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {FontFamilyChoice[]} */
  #choices

  /** @type {HTMLElement} */
  #root

  /** @type {HTMLButtonElement} */
  #trigger

  /** @type {HTMLElement} */
  #labelEl

  /** @type {HTMLElement} */
  #menu

  /** @type {(e: MouseEvent) => void} */
  #onDocClick

  /**
   * @param {BonsaiEditor} editor
   * @param {FontFamilyChoice[]} [choices]
   */
  constructor(editor, choices = DEFAULT_FONT_FAMILIES) {
    this.#editor = editor
    this.#choices = choices

    this.#root = document.createElement('div')
    this.#root.className = 'bonsai-editor__font-select'

    this.#trigger = document.createElement('button')
    this.#trigger.type = 'button'
    this.#trigger.className = 'bonsai-editor__font-trigger'
    this.#trigger.setAttribute('aria-haspopup', 'listbox')
    this.#trigger.setAttribute('aria-expanded', 'false')
    this.#trigger.setAttribute('aria-label', 'Betűtípus')

    this.#labelEl = document.createElement('span')
    this.#labelEl.className = 'bonsai-editor__font-label'

    const chevron = createToolbarIcon('chevronDown')
    if (chevron) chevron.classList.add('bonsai-editor__font-chevron')

    this.#trigger.append(this.#labelEl)
    if (chevron) this.#trigger.appendChild(chevron)

    this.#menu = document.createElement('div')
    this.#menu.className = 'bonsai-editor__font-menu'
    this.#menu.setAttribute('role', 'listbox')
    this.#menu.setAttribute('aria-label', 'Betűtípusok')
    this.#menu.hidden = true

    this.#trigger.addEventListener('mousedown', (e) => e.preventDefault())
    this.#trigger.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.#toggleMenu()
    })

    this.#onDocClick = (e) => {
      if (!this.#root.contains(/** @type {Node} */ (e.target))) this.#closeMenu()
    }

    this.#root.append(this.#trigger, this.#menu)
    this.#buildMenuOptions()
    this.sync()
  }

  get element() {
    return this.#root
  }

  #buildMenuOptions() {
    this.#menu.replaceChildren()

    for (const choice of this.#choices) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'bonsai-editor__font-option'
      btn.dataset.fontId = choice.id
      btn.setAttribute('role', 'option')
      btn.textContent = choice.label
      if (choice.value) {
        btn.style.fontFamily = choice.value
      }
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const chain = this.#editor.tiptap.chain().focus()
        if (choice.value) {
          chain.setFontFamily(choice.value).run()
        } else {
          chain.unsetFontFamily().run()
        }
        this.#closeMenu()
        this.sync()
      })
      this.#menu.appendChild(btn)
    }
  }

  #toggleMenu() {
    if (this.#menu.hidden) this.#openMenu()
    else this.#closeMenu()
  }

  #openMenu() {
    this.#buildMenuOptions()
    this.#menu.hidden = false
    this.#trigger.setAttribute('aria-expanded', 'true')
    document.addEventListener('click', this.#onDocClick)
  }

  #closeMenu() {
    this.#menu.hidden = true
    this.#trigger.setAttribute('aria-expanded', 'false')
    document.removeEventListener('click', this.#onDocClick)
  }

  sync() {
    if (this.#editor.isDestroyed) return
    const activeValue = getActiveFontFamilyValue(this.#editor.tiptap, this.#choices)
    this.#labelEl.textContent = getActiveFontFamilyLabel(this.#editor.tiptap, this.#choices)
    if (activeValue) {
      this.#labelEl.style.fontFamily = activeValue
    } else {
      this.#labelEl.style.fontFamily = ''
    }

    for (const opt of this.#menu.querySelectorAll('.bonsai-editor__font-option')) {
      const choice = this.#choices.find((c) => c.id === opt.dataset.fontId)
      const active =
        choice?.value == null
          ? activeValue == null
          : choice?.value === activeValue
      opt.setAttribute('aria-selected', active ? 'true' : 'false')
      opt.classList.toggle('is-active', active)
    }
  }

  destroy() {
    this.#closeMenu()
  }
}
