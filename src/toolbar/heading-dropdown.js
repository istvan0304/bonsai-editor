import { createToolbarIcon } from './icons.js'
import { getActiveHeadingLevel, getHeadingLevels } from './heading-levels.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 */

export class HeadingDropdown {
  /** @type {BonsaiEditor} */
  #editor

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
   */
  constructor(editor) {
    this.#editor = editor
    this.#root = document.createElement('div')
    this.#root.className = 'bonsai-editor__heading-select'

    this.#trigger = document.createElement('button')
    this.#trigger.type = 'button'
    this.#trigger.className = 'bonsai-editor__heading-trigger'
    this.#trigger.setAttribute('aria-haspopup', 'listbox')
    this.#trigger.setAttribute('aria-expanded', 'false')

    this.#labelEl = document.createElement('span')
    this.#labelEl.className = 'bonsai-editor__heading-label'

    const chevron = createToolbarIcon('chevronDown')
    if (chevron) chevron.classList.add('bonsai-editor__heading-chevron')

    this.#trigger.append(this.#labelEl)
    if (chevron) this.#trigger.appendChild(chevron)

    this.#menu = document.createElement('div')
    this.#menu.className = 'bonsai-editor__heading-menu'
    this.#menu.setAttribute('role', 'listbox')
    this.#menu.hidden = true
    this.#refreshStaticLabels()

    this.#buildMenuOptions()

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
    this.sync()
  }

  get element() {
    return this.#root
  }

  #buildMenuOptions() {
    this.#menu.replaceChildren()

    const normal = document.createElement('button')
    normal.type = 'button'
    normal.className = 'bonsai-editor__heading-option bonsai-editor__heading-option--normal'
    normal.dataset.level = '0'
    normal.setAttribute('role', 'option')
    normal.textContent = this.#optionLabel(0)
    normal.addEventListener('click', (e) => {
      e.preventDefault()
      this.#editor.tiptap.chain().focus().setParagraph().run()
      this.#closeMenu()
      this.sync()
    })
    this.#menu.appendChild(normal)

    for (const level of getHeadingLevels(this.#editor)) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `bonsai-editor__heading-option bonsai-editor__heading-option--h${level}`
      btn.dataset.level = String(level)
      btn.setAttribute('role', 'option')
      btn.textContent = this.#optionLabel(level)
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        this.#editor.tiptap.chain().focus().setHeading({ level }).run()
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

  /** @param {number} level 0 = normal */
  #optionLabel(level) {
    const t = this.#editor.t
    if (!level) return t('heading.normal')
    return t('heading.level', { level })
  }

  #refreshStaticLabels() {
    const t = this.#editor.t
    this.#trigger.setAttribute('aria-label', t('heading.styleAria'))
    this.#menu.setAttribute('aria-label', t('heading.listAria'))
  }

  refreshLocale() {
    this.#refreshStaticLabels()
    this.#buildMenuOptions()
    this.sync()
  }

  sync() {
    if (this.#editor.isDestroyed) return
    const level = getActiveHeadingLevel(this.#editor)
    this.#labelEl.textContent = level ? this.#optionLabel(level) : this.#optionLabel(0)

    for (const opt of this.#menu.querySelectorAll('.bonsai-editor__heading-option')) {
      const optLevel = Number(opt.dataset.level)
      const active = level === null ? optLevel === 0 : optLevel === level
      opt.setAttribute('aria-selected', active ? 'true' : 'false')
      opt.classList.toggle('is-active', active)
    }
  }

  destroy() {
    this.#closeMenu()
  }
}
