import { getEditorAction } from '../toolbar/editor-actions.js'
import { runEditorAction } from '../toolbar/run-editor-action.js'
import { getHeadingLevels } from '../toolbar/heading-levels.js'
import { MENUBAR_MENU_DEFS, MENUBAR_MENU_ORDER } from './menubar-defs.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {import('./menubar-config.js').MenubarMenuId} MenubarMenuId
 */

export class BonsaiMenubar {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {HTMLElement} */
  #host

  /** @type {Set<MenubarMenuId>} */
  #enabled

  /** @type {HTMLElement | null} */
  #bar = null

  /** @type {Map<MenubarMenuId, { trigger: HTMLButtonElement; panel: HTMLElement; items: HTMLButtonElement[] }>} */
  #menus = new Map()

  /** @type {MenubarMenuId | null} */
  #openMenu = null

  /** @type {(e: MouseEvent) => void} */
  #onDocClick

  /** @type {(e: KeyboardEvent) => void} */
  #onDocKey

  /** @type {(() => void) | null} */
  #onSelection = null

  /**
   * @param {BonsaiEditor} editor
   * @param {{ element: HTMLElement; menus: Set<MenubarMenuId> }} options
   */
  constructor(editor, options) {
    this.#editor = editor
    this.#host = options.element
    this.#enabled = options.menus

    this.#onDocClick = (e) => {
      if (!(e.target instanceof Node)) return
      if (this.#openMenu && this.#bar?.contains(e.target)) return
      this.#closeMenu()
    }

    this.#onDocKey = (e) => {
      if (e.key === 'Escape') this.#closeMenu()
    }
  }

  mount() {
    const bar = document.createElement('div')
    bar.className = 'bonsai-editor__menubar'
    bar.setAttribute('role', 'menubar')
    bar.setAttribute('aria-label', this.#editor.t('menubar.ariaLabel'))

    for (const menuId of MENUBAR_MENU_ORDER) {
      if (!this.#enabled.has(menuId)) continue
      const def = MENUBAR_MENU_DEFS[menuId]
      if (!def) continue

      const wrap = document.createElement('div')
      wrap.className = 'bonsai-editor__menubar-item'
      wrap.dataset.menu = menuId

      const trigger = document.createElement('button')
      trigger.type = 'button'
      trigger.className = 'bonsai-editor__menubar-trigger'
      trigger.setAttribute('role', 'menuitem')
      trigger.setAttribute('aria-haspopup', 'menu')
      trigger.setAttribute('aria-expanded', 'false')
      trigger.textContent = this.#editor.t(`menubar.${menuId}`)

      const panel = document.createElement('div')
      panel.className = 'bonsai-editor__menubar-panel'
      panel.setAttribute('role', 'menu')
      panel.hidden = true

      /** @type {HTMLButtonElement[]} */
      const itemButtons = []

      for (const entry of def.items) {
        if (entry.kind === 'sep') {
          const sep = document.createElement('div')
          sep.className = 'bonsai-editor__menubar-sep'
          sep.setAttribute('role', 'separator')
          panel.appendChild(sep)
          continue
        }

        if (entry.kind === 'headingLevels') {
          for (const level of getHeadingLevels(this.#editor)) {
            const actionId = `heading:${level}`
            const action = getEditorAction(actionId, this.#editor.t)
            if (!action) continue
            const btn = this.#createMenuButton(actionId, action.label)
            panel.appendChild(btn)
            itemButtons.push(btn)
          }
          continue
        }

        if (entry.kind === 'item') {
          const action = getEditorAction(entry.action, this.#editor.t)
          if (!action) continue
          const btn = this.#createMenuButton(entry.action, action.label)
          panel.appendChild(btn)
          itemButtons.push(btn)
        }
      }

      trigger.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        if (this.#openMenu === menuId) {
          this.#closeMenu()
        } else {
          this.#openMenuId(menuId)
        }
      })

      wrap.append(trigger, panel)
      bar.appendChild(wrap)
      this.#menus.set(menuId, { trigger, panel, items: itemButtons })
    }

    this.#host.appendChild(bar)
    this.#bar = bar

    document.addEventListener('click', this.#onDocClick)
    document.addEventListener('keydown', this.#onDocKey)

    this.#onSelection = () => this.#syncState()
    this.#editor.on('selectionUpdate', this.#onSelection)
    this.#editor.on('update', this.#onSelection)
    this.#syncState()
  }

  /**
   * @param {string} actionId
   * @param {string} label
   */
  #createMenuButton(actionId, label) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'bonsai-editor__menubar-action'
    btn.setAttribute('role', 'menuitem')
    btn.dataset.action = actionId
    btn.textContent = label
    btn.addEventListener('click', (ev) => {
      ev.preventDefault()
      const action = getEditorAction(actionId, this.#editor.t)
      if (!action) return
      void runEditorAction(this.#editor, action).finally(() => {
        this.#syncState()
        this.#closeMenu()
      })
    })
    return btn
  }

  /**
   * @param {MenubarMenuId} menuId
   */
  #openMenuId(menuId) {
    this.#closeMenu()
    const menu = this.#menus.get(menuId)
    if (!menu) return
    menu.panel.hidden = false
    menu.trigger.setAttribute('aria-expanded', 'true')
    menu.trigger.classList.add('is-open')
    this.#openMenu = menuId
  }

  #closeMenu() {
    if (!this.#openMenu) return
    const menu = this.#menus.get(this.#openMenu)
    if (menu) {
      menu.panel.hidden = true
      menu.trigger.setAttribute('aria-expanded', 'false')
      menu.trigger.classList.remove('is-open')
    }
    this.#openMenu = null
  }

  sync() {
    this.#syncState()
  }

  #syncState() {
    if (this.#editor.isDestroyed) return
    const sourceMode = this.#editor.isSourceView
    const t = this.#editor.t

    if (this.#bar) {
      this.#bar.setAttribute('aria-label', t('menubar.ariaLabel'))
    }

    for (const [menuId, menu] of this.#menus) {
      menu.trigger.textContent = t(`menubar.${menuId}`)

      for (const btn of menu.items) {
        const actionId = btn.dataset.action
        if (!actionId) continue
        const action = getEditorAction(actionId, t)
        if (!action) continue

        if (actionId !== 'fullscreen') {
          btn.textContent = action.label
        }

        const fileOk = actionId === 'copyContent' || actionId === 'clearContent'
        const viewOk = actionId === 'sourceCode' || actionId === 'fullscreen'
        const editOk =
          actionId === 'cut' || actionId === 'copy' || actionId === 'paste' || actionId === 'selectAll'

        let disabled = false

        if (actionId === 'fullscreen') {
          disabled = !this.#editor.isFullscreenSupported
          btn.textContent = this.#editor.isFullscreen ? t('fullscreen.exit') : t('fullscreen.enter')
        }

        if (sourceMode) {
          if (!fileOk && !viewOk && !editOk) {
            disabled = true
          }
        } else if (action.canRun) {
          disabled = !action.canRun(this.#editor)
        }

        btn.disabled = disabled
        btn.classList.toggle('is-active', !!action.isActive?.(this.#editor))
        btn.setAttribute('aria-checked', action.isActive?.(this.#editor) ? 'true' : 'false')
      }
    }
  }

  destroy() {
    document.removeEventListener('click', this.#onDocClick)
    document.removeEventListener('keydown', this.#onDocKey)
    if (this.#onSelection) {
      this.#editor.off('selectionUpdate', this.#onSelection)
      this.#editor.off('update', this.#onSelection)
    }
    this.#closeMenu()
    this.#menus.clear()
    this.#host.innerHTML = ''
    this.#bar = null
  }
}
