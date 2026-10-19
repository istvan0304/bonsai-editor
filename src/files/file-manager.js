import { formatFileSize } from './file-store.js'
import { LocalBrowseStore } from './local-browse.js'
import {
  browseDirectory,
  createFolderOnServer,
  deleteEntryOnServer,
  resolveUploadConfig,
  uploadFileToServer,
} from './file-upload.js'
import { buildBrowseEntryMetadataRows, isImageBrowseEntry } from './entry-metadata.js'
import { joinBrowsePath, normalizeBrowsePath, parentBrowsePath, sanitizeFolderName } from './path-utils.js'
import { filterBrowseFilesByName } from './filter-entries.js'
import { fileSortIndicator, sortBrowseFileEntries } from './sort-entries.js'

/**
 * @typedef {import('../core/editor.js').BonsaiEditor} BonsaiEditor
 * @typedef {import('./file-upload.js').BrowseEntry} BrowseEntry
 * @typedef {import('./file-upload.js').BrowseListing} BrowseListing
 * @typedef {import('./file-upload.js').FileUploadConfig} FileUploadConfig
 * @typedef {FileUploadConfig & {
 *   maxFileSize?: number;
 *   accept?: string;
 *   initialPath?: string; // megnyitáskor kezdő mappa (browse útvonal); alap: gyökér
 *   startFolder?: string; // ugyanaz, mint initialPath
 * }} FileManagerOptions
 */

const DEFAULT_MAX_SIZE = 15 * 1024 * 1024

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {string} text
 */
function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

/**
 * @param {import('./file-upload.js').BrowseEntry} entry
 */
/**
 * @param {BrowseEntry} entry
 * @param {boolean} checked
 * @param {(entry: BrowseEntry, checked: boolean) => void} onCheckChange
 * @param {(entry: BrowseEntry) => void} onDelete
 */
/**
 * @param {import('../i18n/index.js').TranslateFn} t
 */
function buildFileActionsCell(entry, checked, onCheckChange, onDelete, t) {
  const td = document.createElement('td')
  td.className = 'bonsai-editor__file-manager-file-actions'

  const checkLabel = document.createElement('label')
  checkLabel.className = 'bonsai-editor__file-manager-file-check-label'
  checkLabel.title = t('fileManager.batchSelect')

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = 'bonsai-editor__file-manager-file-check'
  checkbox.checked = checked
  checkbox.setAttribute('aria-label', t('fileManager.selectEntry', { name: entry.name }))
  checkbox.addEventListener('mousedown', (e) => e.stopPropagation())
  checkbox.addEventListener('click', (e) => e.stopPropagation())
  checkbox.addEventListener('change', () => {
    onCheckChange(entry, checkbox.checked)
  })

  checkLabel.appendChild(checkbox)

  const deleteBtn = document.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'bonsai-editor__file-manager-file-delete'
  deleteBtn.title = t('fileManager.deleteFile')
  deleteBtn.setAttribute('aria-label', t('fileManager.deleteEntry', { name: entry.name }))
  deleteBtn.textContent = '×'
  deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation())
  deleteBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(entry)
  })

  td.append(checkLabel, deleteBtn)
  return td
}

function buildFilePreviewCell(entry) {
  const td = document.createElement('td')
  td.className = 'bonsai-editor__file-manager-preview-cell'

  if (isImageBrowseEntry(entry) && entry.url) {
    const img = document.createElement('img')
    img.className = 'bonsai-editor__file-manager-thumb'
    img.src = entry.url
    img.alt = ''
    img.loading = 'lazy'
    img.decoding = 'async'
    td.appendChild(img)
    return td
  }

  const placeholder = document.createElement('span')
  placeholder.className = 'bonsai-editor__file-manager-thumb-placeholder'
  placeholder.textContent = '📄'
  placeholder.setAttribute('aria-hidden', 'true')
  td.appendChild(placeholder)
  return td
}

export class FileManager {
  /** @type {BonsaiEditor} */
  #editor

  /** @type {Required<Pick<FileManagerOptions, 'maxFileSize'>> & FileManagerOptions} */
  #options

  /** @type {ReturnType<typeof resolveUploadConfig>} */
  #uploadConfig

  /** @type {LocalBrowseStore} */
  #localStore = new LocalBrowseStore()

  /** @type {boolean} */
  #open = false

  /** @type {boolean} */
  #uploading = false

  /** @type {HTMLElement | null} */
  #overlay = null

  /** @type {string} */
  #currentPath = ''

  /** @type {BrowseListing | null} */
  #listing = null

  /** @type {BrowseEntry | null} */
  #selectedEntry = null

  /** @type {'dirs' | 'files'} */
  #activePanel = 'dirs'

  /** @type {import('./sort-entries.js').FileSortKey} */
  #fileSortKey = 'name'

  /** @type {import('./sort-entries.js').SortDirection} */
  #fileSortDir = 'asc'

  /** @type {string} */
  #fileNameFilter = ''

  /** @type {Set<string>} */
  #checkedFilePaths = new Set()

  /** @type {(() => void) | null} */
  #dialogDragTeardown = null

  /** @type {boolean} */
  #dialogFullscreen = false

  /** @type {(e: KeyboardEvent) => void} */
  #onKeyDown

  constructor(editor, options = {}) {
    this.#editor = editor
    this.#options = {
      maxFileSize: options.maxFileSize ?? DEFAULT_MAX_SIZE,
      ...options,
    }
    this.#uploadConfig = resolveUploadConfig(this.#options)
    this.#onKeyDown = (e) => {
      if (!this.#open) return
      if (e.key === 'Escape') {
        if (this.#dialogFullscreen) {
          e.preventDefault()
          this.#setDialogFullscreen(false)
          return
        }
        this.close()
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        void this.#navigateUp()
      }
      if (e.key === 'F5') {
        e.preventDefault()
        void this.#loadDirectory(this.#currentPath)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        this.#focusFileSearch()
      }
      if (e.key === 'F8') {
        e.preventDefault()
        void this.#deleteSelected()
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (this.#activePanel === 'dirs') this.#enterSelectedDirectory()
        else if (this.#selectedEntry?.kind === 'file') this.insertIntoDocument(this.#selectedEntry)
      }
    }
  }

  get isOpen() {
    return this.#open
  }

  get #hasServerUpload() {
    return Boolean(this.#uploadConfig.uploadUrl || this.#uploadConfig.upload)
  }

  get #useServerBrowse() {
    return Boolean(
      this.#uploadConfig.browseDirectory ||
        this.#uploadConfig.browseUrl ||
        this.#uploadConfig.listUrl ||
        this.#uploadConfig.uploadUrl,
    )
  }

  #resolveInitialBrowsePath() {
    const raw = this.#options.initialPath ?? this.#options.startFolder ?? ''
    return normalizeBrowsePath(raw)
  }

  open() {
    if (this.#editor.isDestroyed || this.#editor.isSourceView) return
    if (!this.#overlay) this.#buildUi()
    this.#open = true
    this.#overlay.hidden = false
    document.addEventListener('keydown', this.#onKeyDown)
    this.#editor.syncChrome()
    void this.#loadDirectory(this.#resolveInitialBrowsePath())
    this.#overlay.querySelector('.bonsai-editor__file-manager-close')?.focus()
  }

  close(opts = {}) {
    const restoreFocus = opts.restoreFocus !== false
    if (!this.#open) return
    this.#open = false
    if (this.#overlay) this.#overlay.hidden = true
    this.#resetDialogPosition()
    document.removeEventListener('keydown', this.#onKeyDown)
    if (!this.#editor.isDestroyed) {
      this.#editor.syncChrome()
      if (restoreFocus) this.#editor.focus()
    }
  }

  /**
   * @param {BrowseEntry} entry
   */
  insertIntoDocument(entry) {
    if (this.#editor.isDestroyed || entry.kind !== 'file' || !entry.url) return
    const { tiptap } = this.#editor
    const safeName = escapeHtml(entry.name)
    const safeUrl = escapeAttr(entry.url)

    if ((entry.type || '').startsWith('image/')) {
      tiptap.chain().focus().setImage({ src: entry.url, alt: entry.name, title: entry.name }).run()
    } else {
      tiptap
        .chain()
        .focus()
        .insertContent(`<a href="${safeUrl}" download="${escapeAttr(entry.name)}">${safeName}</a> `)
        .run()
    }
    this.close()
  }

  async #loadDirectory(path) {
    const normalized = normalizeBrowsePath(path)
    try {
      if (this.#hasServerUpload && this.#useServerBrowse) {
        this.#listing = await browseDirectory(this.#uploadConfig, normalized)
      } else {
        this.#listing = this.#localStore.browse(normalized)
      }
      this.#currentPath = this.#listing.path
      this.#selectedEntry = null
      this.#checkedFilePaths.clear()
      this.#resetFileSearch()
      this.#setError('')
      this.#renderAll()
    } catch (err) {
      this.#setError(err instanceof Error ? err.message : 'Könyvtár betöltése sikertelen.')
    }
  }

  async #navigate(path) {
    await this.#loadDirectory(path)
  }

  #navigateUp() {
    const target = this.#listing?.parent ?? parentBrowsePath(this.#currentPath)
    void this.#navigate(target)
  }

  #enterSelectedDirectory() {
    const entry = this.#selectedEntry
    if (!entry || entry.kind === 'file') return
    void this.#navigate(entry.path)
  }

  /**
   * @param {BrowseEntry} entry
   * @param {'dirs' | 'files'} panel
   */
  #selectEntry(entry, panel) {
    this.#selectedEntry = entry
    this.#activePanel = panel
    this.#updateSelectionHighlight()
    this.#renderPanelHighlight()
    this.#syncActionButtons()
    this.#renderMetadata()
    this.#revealMetadataPanel()
  }

  #clearSelection() {
    if (!this.#selectedEntry) return
    this.#selectedEntry = null
    this.#updateSelectionHighlight()
    this.#syncActionButtons()
    this.#renderMetadata()
  }

  /**
   * @param {EventTarget | null} target
   */
  #shouldClearSelectionOnClick(target) {
    if (!(target instanceof Element)) return false
    if (target.closest('tr[data-kind]')) return false
    if (target.closest('.bonsai-editor__file-manager-commandbar button')) return false
    if (target.closest('.bonsai-editor__file-manager-close')) return false
    if (target.closest('[data-action="fullscreen-toggle"]')) return false
    if (target.closest('.bonsai-editor__file-manager-path-part')) return false
    if (target.closest('.bonsai-editor__file-manager-meta-link')) return false
    if (target.closest('.bonsai-editor__file-manager-input')) return false
    if (target.closest('.bonsai-editor__file-manager-search-input')) return false
    if (target.closest('.bonsai-editor__file-manager-file-actions')) return false
    return true
  }

  /**
   * @param {BrowseEntry} entry
   */
  #fileCheckKey(entry) {
    return normalizeBrowsePath(entry.path)
  }

  /**
   * @param {BrowseEntry} entry
   * @param {boolean} checked
   */
  #toggleFileChecked(entry, checked) {
    const key = this.#fileCheckKey(entry)
    if (checked) this.#checkedFilePaths.add(key)
    else this.#checkedFilePaths.delete(key)
    this.#updateFileCheckHighlight()
    this.#syncActionButtons()
  }

  #updateFileCheckHighlight() {
    this.#overlay?.querySelectorAll('[data-panel="files"] tbody tr[data-kind="file"]').forEach((row) => {
      const path = normalizeBrowsePath(row.getAttribute('data-path') ?? '')
      row.classList.toggle('is-batch-selected', this.#checkedFilePaths.has(path))
      const checkbox = row.querySelector('.bonsai-editor__file-manager-file-check')
      if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = this.#checkedFilePaths.has(path)
      }
    })
  }

  /**
   * @returns {BrowseEntry[]}
   */
  #getCheckedFileEntries() {
    if (!this.#listing) return []
    return this.#listing.entries.filter(
      (entry) => entry.kind === 'file' && this.#checkedFilePaths.has(this.#fileCheckKey(entry)),
    )
  }

  /**
   * @param {BrowseEntry} entry
   */
  async #deleteEntry(entry) {
    if (entry.kind === 'parent') return
    if (this.#hasServerUpload && this.#useServerBrowse) {
      await deleteEntryOnServer(entry, this.#uploadConfig)
    } else {
      this.#localStore.removeEntry(entry)
    }
  }

  /**
   * @param {BrowseEntry} entry
   */
  async #deleteFileRow(entry) {
    try {
      await this.#deleteEntry(entry)
      this.#checkedFilePaths.delete(this.#fileCheckKey(entry))
      if (this.#selectedEntry?.path === entry.path && this.#selectedEntry?.kind === 'file') {
        this.#selectedEntry = null
      }
      this.#setError('')
      await this.#loadDirectory(this.#currentPath)
    } catch (err) {
      this.#setError(err instanceof Error ? err.message : 'Törlés sikertelen.')
    }
  }

  #updateSelectionHighlight() {
    this.#overlay?.querySelectorAll('.bonsai-editor__file-manager-table tbody tr[data-kind]').forEach((row) => {
      const path = row.getAttribute('data-path') ?? ''
      const kind = row.getAttribute('data-kind') ?? ''
      const active = this.#selectedEntry?.path === path && this.#selectedEntry?.kind === kind
      row.classList.toggle('is-selected', active)
    })
  }

  #bindPanelButton(el, handler) {
    el.addEventListener('mousedown', (e) => e.preventDefault())
    el.addEventListener('click', (e) => {
      e.preventDefault()
      handler()
    })
  }

  #resetDialogPosition() {
    this.#setDialogFullscreen(false)
    const dialog = this.#overlay?.querySelector('.bonsai-editor__file-manager-dialog')
    if (!(dialog instanceof HTMLElement)) return
    dialog.classList.remove('bonsai-editor__file-manager-dialog--floating', 'is-dragging')
    dialog.style.left = ''
    dialog.style.top = ''
    dialog.style.width = ''
  }

  /**
   * @param {boolean} enabled
   */
  #setDialogFullscreen(enabled) {
    this.#dialogFullscreen = enabled
    const overlay = this.#overlay
    const dialog = overlay?.querySelector('.bonsai-editor__file-manager-dialog')
    if (!(overlay instanceof HTMLElement) || !(dialog instanceof HTMLElement)) return

    overlay.classList.toggle('is-file-manager-fullscreen', enabled)
    dialog.classList.toggle('bonsai-editor__file-manager-dialog--fullscreen', enabled)

    if (enabled) {
      dialog.classList.remove('bonsai-editor__file-manager-dialog--floating', 'is-dragging')
      dialog.style.left = ''
      dialog.style.top = ''
      dialog.style.width = ''
    }

    this.#syncFullscreenButton()
  }

  #toggleDialogFullscreen() {
    this.#setDialogFullscreen(!this.#dialogFullscreen)
  }

  #syncFullscreenButton() {
    const btn = this.#overlay?.querySelector('[data-action="fullscreen-toggle"]')
    if (!(btn instanceof HTMLButtonElement)) return
    const on = this.#dialogFullscreen
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    btn.setAttribute('aria-label', on ? 'Kilépés a teljes képernyőből' : 'Teljes képernyő')
    btn.title = on ? 'Kilépés a teljes képernyőből' : 'Teljes képernyő'
    btn.textContent = on ? '⤓' : '⤢'
  }

  #setupDialogDrag() {
    const dialog = this.#overlay?.querySelector('.bonsai-editor__file-manager-dialog')
    const header = this.#overlay?.querySelector('.bonsai-editor__file-manager-header')
    if (!(dialog instanceof HTMLElement) || !(header instanceof HTMLElement)) return

    /** @type {{ pointerId: number; startX: number; startY: number; originLeft: number; originTop: number } | null} */
    let drag = null

    /**
     * @param {number} value
     * @param {number} min
     * @param {number} max
     */
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

    /** @param {PointerEvent} e */
    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return
      const rect = dialog.getBoundingClientRect()
      const minVisible = 72
      const maxLeft = window.innerWidth - minVisible
      const maxTop = window.innerHeight - minVisible
      const minLeft = minVisible - rect.width
      const minTop = 0

      const left = clamp(drag.originLeft + (e.clientX - drag.startX), minLeft, maxLeft)
      const top = clamp(drag.originTop + (e.clientY - drag.startY), minTop, maxTop)
      dialog.style.left = `${left}px`
      dialog.style.top = `${top}px`
    }

    /** @param {PointerEvent} e */
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return
      drag = null
      dialog.classList.remove('is-dragging')
      if (header.hasPointerCapture(e.pointerId)) {
        header.releasePointerCapture(e.pointerId)
      }
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', endDrag)
      document.removeEventListener('pointercancel', endDrag)
    }

    /** @param {PointerEvent} e */
    const onPointerDown = (e) => {
      if (!(e.target instanceof Element)) return
      if (e.target.closest('.bonsai-editor__file-manager-close')) return
      if (e.target.closest('[data-action="fullscreen-toggle"]')) return
      if (this.#dialogFullscreen) return
      if (e.button !== 0) return

      const rect = dialog.getBoundingClientRect()
      if (!dialog.classList.contains('bonsai-editor__file-manager-dialog--floating')) {
        dialog.classList.add('bonsai-editor__file-manager-dialog--floating')
        dialog.style.width = `${rect.width}px`
        dialog.style.left = `${rect.left}px`
        dialog.style.top = `${rect.top}px`
      }

      drag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originLeft: parseFloat(dialog.style.left) || rect.left,
        originTop: parseFloat(dialog.style.top) || rect.top,
      }
      dialog.classList.add('is-dragging')
      header.setPointerCapture(e.pointerId)
      e.preventDefault()
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', endDrag)
      document.addEventListener('pointercancel', endDrag)
    }

    header.addEventListener('pointerdown', onPointerDown)
    this.#dialogDragTeardown = () => {
      header.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', endDrag)
      document.removeEventListener('pointercancel', endDrag)
      drag = null
    }
  }

  #buildUi() {
    const overlay = document.createElement('div')
    overlay.className = 'bonsai-editor__file-manager-overlay'
    overlay.hidden = true
    overlay.innerHTML = `
      <div class="bonsai-editor__file-manager-dialog bonsai-editor__file-manager-dialog--nc" role="dialog" aria-modal="true" aria-labelledby="bonsai-fm-title">
        <header class="bonsai-editor__file-manager-header">
          <h2 id="bonsai-fm-title" class="bonsai-editor__file-manager-title">Fájlkezelő <span class="bonsai-editor__file-manager-drag-hint">— húzd a fejlécet</span></h2>
          <div class="bonsai-editor__file-manager-header-actions">
            <button type="button" class="bonsai-editor__file-manager-fullscreen" data-action="fullscreen-toggle" aria-pressed="false" aria-label="Teljes képernyő" title="Teljes képernyő">⤢</button>
            <button type="button" class="bonsai-editor__file-manager-close" aria-label="Bezárás">×</button>
          </div>
        </header>
        <div class="bonsai-editor__file-manager-commandbar">
          <button type="button" class="bonsai-editor__fm-btn" data-action="up">↑ Fel</button>
          <button type="button" class="bonsai-editor__fm-btn" data-action="down">↓ Le</button>
          <button type="button" class="bonsai-editor__fm-btn" data-action="refresh">↻ Frissítés</button>
          <button type="button" class="bonsai-editor__fm-btn" data-action="mkdir">📁 Új mappa</button>
          <button type="button" class="bonsai-editor__fm-btn" data-action="upload">⬆ Feltöltés ide</button>
          <button type="button" class="bonsai-editor__fm-btn bonsai-editor__fm-btn--primary" data-action="insert" disabled>F7 Beszúrás</button>
          <button type="button" class="bonsai-editor__fm-btn bonsai-editor__fm-btn--danger" data-action="delete" disabled>F8 Törlés</button>
        </div>
        <div class="bonsai-editor__file-manager-path" aria-label="Aktuális útvonal"></div>
        <div class="bonsai-editor__file-manager-main">
          <div class="bonsai-editor__file-manager-panels">
            <section class="bonsai-editor__file-manager-panel is-active" data-panel="dirs" aria-label="Mappák">
              <header>Mappák</header>
              <div class="bonsai-editor__file-manager-table-wrap">
                <table class="bonsai-editor__file-manager-table">
                  <thead><tr><th>Név</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>
            <section class="bonsai-editor__file-manager-panel" data-panel="files" aria-label="Fájlok">
              <header class="bonsai-editor__file-manager-panel-header">
                <span class="bonsai-editor__file-manager-panel-title">Fájlok</span>
                <label class="bonsai-editor__file-manager-search">
                  <span class="bonsai-editor__file-manager-search-label">Keresés név szerint</span>
                  <input
                    type="search"
                    class="bonsai-editor__file-manager-search-input"
                    placeholder="Keresés a mappában…"
                    autocomplete="off"
                    spellcheck="false"
                  />
                </label>
              </header>
              <div class="bonsai-editor__file-manager-table-wrap">
                <table class="bonsai-editor__file-manager-table">
                  <thead>
                    <tr>
                      <th scope="col" class="bonsai-editor__file-manager-th-preview" aria-hidden="true"></th>
                      <th scope="col">
                        <button type="button" class="bonsai-editor__file-manager-sort is-active" data-sort="name">Név</button>
                      </th>
                      <th scope="col">
                        <button type="button" class="bonsai-editor__file-manager-sort" data-sort="size">Méret</button>
                      </th>
                      <th scope="col">
                        <button type="button" class="bonsai-editor__file-manager-sort" data-sort="type">Típus</button>
                      </th>
                      <th scope="col" class="bonsai-editor__file-manager-th-actions">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>
          </div>
          <section class="bonsai-editor__file-manager-details" aria-label="Metaadatok">
            <header class="bonsai-editor__file-manager-details-header">Metaadatok</header>
            <div class="bonsai-editor__file-manager-details-body">
              <p class="bonsai-editor__file-manager-details-empty">Válassz egy fájlt vagy mappát a listából.</p>
            </div>
          </section>
        </div>
        <div class="bonsai-editor__file-manager-upload">
          <input type="file" class="bonsai-editor__file-manager-input" multiple hidden />
          <p class="bonsai-editor__file-manager-status" hidden></p>
          <p class="bonsai-editor__file-manager-hint"></p>
          <p class="bonsai-editor__file-manager-error" role="alert" hidden></p>
        </div>
      </div>
    `

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })
    const dialog = overlay.querySelector('.bonsai-editor__file-manager-dialog')
    dialog?.addEventListener('click', (e) => {
      if (this.#shouldClearSelectionOnClick(e.target)) {
        this.#clearSelection()
      }
    })
    dialog?.addEventListener('click', (e) => e.stopPropagation())
    overlay.querySelector('.bonsai-editor__file-manager-close')?.addEventListener('click', () => this.close())
    overlay.querySelector('[data-action="fullscreen-toggle"]')?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.#toggleDialogFullscreen()
    })

    const upBtn = overlay.querySelector('[data-action="up"]')
    const downBtn = overlay.querySelector('[data-action="down"]')
    const refreshBtn = overlay.querySelector('[data-action="refresh"]')
    const mkdirBtn = overlay.querySelector('[data-action="mkdir"]')
    const uploadBtn = overlay.querySelector('[data-action="upload"]')
    const insertBtn = overlay.querySelector('[data-action="insert"]')
    const deleteBtn = overlay.querySelector('[data-action="delete"]')

    if (upBtn) this.#bindPanelButton(upBtn, () => this.#navigateUp())
    if (downBtn) this.#bindPanelButton(downBtn, () => this.#enterSelectedDirectory())
    if (refreshBtn) this.#bindPanelButton(refreshBtn, () => void this.#loadDirectory(this.#currentPath))
    if (mkdirBtn) this.#bindPanelButton(mkdirBtn, () => void this.#createFolderPrompt())
    if (uploadBtn) {
      this.#bindPanelButton(uploadBtn, () => {
        if (!this.#uploading) overlay.querySelector('.bonsai-editor__file-manager-input')?.click()
      })
    }
    if (insertBtn) {
      this.#bindPanelButton(insertBtn, () => {
        if (this.#selectedEntry?.kind === 'file') this.insertIntoDocument(this.#selectedEntry)
      })
    }
    if (deleteBtn) {
      this.#bindPanelButton(deleteBtn, () => {
        void this.#deleteSelected()
      })
    }

    overlay.querySelectorAll('.bonsai-editor__file-manager-panel').forEach((panel) => {
      panel.addEventListener('mousedown', () => {
        const id = panel.getAttribute('data-panel')
        if (id === 'dirs' || id === 'files') {
          this.#activePanel = id
          this.#renderPanelHighlight()
        }
      })
    })

    const fileSearchInput = /** @type {HTMLInputElement | null} */ (
      overlay.querySelector('.bonsai-editor__file-manager-search-input')
    )
    fileSearchInput?.addEventListener('input', () => {
      this.#fileNameFilter = fileSearchInput.value
      this.#renderFilesPanel()
    })
    fileSearchInput?.addEventListener('keydown', (e) => {
      e.stopPropagation()
    })

    overlay.querySelectorAll('[data-panel="files"] .bonsai-editor__file-manager-sort').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault())
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const key = btn.getAttribute('data-sort')
        if (key === 'name' || key === 'size' || key === 'type') {
          this.#setFileSort(key)
        }
      })
    })

    const input = /** @type {HTMLInputElement | null} */ (overlay.querySelector('.bonsai-editor__file-manager-input'))
    if (this.#options.accept) input?.setAttribute('accept', this.#options.accept)
    input?.addEventListener('change', () => {
      if (input.files) void this.#addFiles(input.files)
      input.value = ''
    })

    this.#editor.rootElement.appendChild(overlay)
    this.#overlay = overlay
    this.#setupDialogDrag()
    this.#applyLocale()
  }

  syncLocale() {
    if (!this.#overlay) return
    this.#applyLocale()
    this.#renderMetadata()
    this.#syncActionButtons()
    this.#renderFilesPanel()
  }

  #applyLocale() {
    const t = this.#editor.t
    const overlay = this.#overlay
    if (!overlay) return

    const title = overlay.querySelector('.bonsai-editor__file-manager-title')
    if (title) {
      title.textContent = ''
      title.append(t('fileManager.title'), ' ')
      const dragHint = document.createElement('span')
      dragHint.className = 'bonsai-editor__file-manager-drag-hint'
      dragHint.textContent = t('fileManager.dragHint')
      title.appendChild(dragHint)
    }

    overlay.querySelector('.bonsai-editor__file-manager-close')?.setAttribute('aria-label', t('fileManager.close'))

    const fsBtn = overlay.querySelector('[data-action="fullscreen-toggle"]')
    if (fsBtn instanceof HTMLButtonElement) {
      const label = this.#dialogFullscreen ? t('fullscreen.exit') : t('fullscreen.enter')
      fsBtn.setAttribute('aria-label', label)
      fsBtn.title = label
    }

    const cmdLabels = /** @type {Record<string, string>} */ ({
      up: 'fileManager.up',
      down: 'fileManager.down',
      refresh: 'fileManager.refresh',
      mkdir: 'fileManager.mkdir',
      upload: 'fileManager.upload',
    })
    for (const [action, key] of Object.entries(cmdLabels)) {
      const btn = overlay.querySelector(`[data-action="${action}"]`)
      if (btn) btn.textContent = t(key)
    }

    overlay.querySelector('.bonsai-editor__file-manager-path')?.setAttribute('aria-label', t('fileManager.pathAria'))

    const dirsPanel = overlay.querySelector('[data-panel="dirs"]')
    dirsPanel?.setAttribute('aria-label', t('fileManager.folders'))
    const dirsHeader = dirsPanel?.querySelector('header')
    if (dirsHeader) dirsHeader.textContent = t('fileManager.folders')

    const filesPanel = overlay.querySelector('[data-panel="files"]')
    filesPanel?.setAttribute('aria-label', t('fileManager.files'))
    const filesTitle = overlay.querySelector('.bonsai-editor__file-manager-panel-title')
    if (filesTitle) filesTitle.textContent = t('fileManager.files')

    const searchLabel = overlay.querySelector('.bonsai-editor__file-manager-search-label')
    if (searchLabel) searchLabel.textContent = t('fileManager.searchLabel')

    const searchInput = /** @type {HTMLInputElement | null} */ (
      overlay.querySelector('.bonsai-editor__file-manager-search-input')
    )
    if (searchInput) searchInput.placeholder = t('fileManager.searchPlaceholder')

    overlay.querySelector('.bonsai-editor__file-manager-details')?.setAttribute('aria-label', t('fileManager.metadata'))
    const metaHeader = overlay.querySelector('.bonsai-editor__file-manager-details-header')
    if (metaHeader) metaHeader.textContent = t('fileManager.metadata')

    const sortKeys = /** @type {Record<string, string>} */ ({
      name: 'fileManager.sortName',
      size: 'fileManager.sortSize',
      type: 'fileManager.sortType',
    })
    overlay.querySelectorAll('[data-panel="files"] .bonsai-editor__file-manager-sort').forEach((btn) => {
      const key = btn.getAttribute('data-sort')
      if (key && sortKeys[key]) btn.textContent = t(sortKeys[key])
    })

    const actionsTh = overlay.querySelector('.bonsai-editor__file-manager-th-actions')
    if (actionsTh) actionsTh.textContent = t('fileManager.actions')

    const hint = overlay.querySelector('.bonsai-editor__file-manager-hint')
    if (hint) {
      const max = formatFileSize(this.#options.maxFileSize)
      hint.textContent = this.#hasServerUpload
        ? t('fileManager.hintServer', { max })
        : t('fileManager.hintLocal', { max })
    }

    this.#syncActionButtons()
  }

  async #createFolderPrompt() {
    const name = window.prompt('Új mappa neve', 'új mappa')
    if (name === null) return
    const folderName = sanitizeFolderName(name)
    if (!folderName) {
      this.#setError('Érvénytelen mappa név.')
      return
    }

    try {
      if (this.#hasServerUpload && this.#useServerBrowse) {
        this.#listing = await createFolderOnServer(this.#uploadConfig, this.#currentPath, folderName)
        this.#currentPath = this.#listing.path
      } else {
        this.#listing = this.#localStore.createFolder(this.#currentPath, folderName)
        this.#currentPath = this.#listing.path
      }
      this.#selectedEntry = null
      this.#setError('')
      this.#renderAll()
    } catch (err) {
      this.#setError(err instanceof Error ? err.message : 'Mappa létrehozása sikertelen.')
    }
  }

  async #deleteSelected() {
    const checked = this.#getCheckedFileEntries()
    if (checked.length > 0) {
      const errors = []
      for (const entry of checked) {
        try {
          await this.#deleteEntry(entry)
          this.#checkedFilePaths.delete(this.#fileCheckKey(entry))
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'törlés sikertelen'
          errors.push(`${entry.name}: ${msg}`)
        }
      }
      this.#selectedEntry = null
      if (errors.length) {
        this.#setError(errors.join(' · '))
      } else {
        this.#setError('')
      }
      await this.#loadDirectory(this.#currentPath)
      return
    }

    const entry = this.#selectedEntry
    if (!entry || entry.kind === 'parent') return

    try {
      await this.#deleteEntry(entry)
      this.#selectedEntry = null
      await this.#loadDirectory(this.#currentPath)
    } catch (err) {
      this.#setError(err instanceof Error ? err.message : 'Törlés sikertelen.')
    }
  }

  #setError(message) {
    const errorEl = this.#overlay?.querySelector('.bonsai-editor__file-manager-error')
    if (!errorEl) return
    if (message) {
      errorEl.hidden = false
      errorEl.textContent = message
    } else {
      errorEl.hidden = true
      errorEl.textContent = ''
    }
  }

  #setUploading(uploading) {
    this.#uploading = uploading
    const status = this.#overlay?.querySelector('.bonsai-editor__file-manager-status')
    if (status) {
      status.hidden = !uploading
      status.textContent = uploading ? `Feltöltés ide: /${this.#currentPath || ''}…` : ''
    }
  }

  async #addFiles(files) {
    const errors = []
    this.#setUploading(true)
    try {
      for (const file of files) {
        if (file.size > this.#options.maxFileSize) {
          errors.push(`${file.name}: túl nagy (max. ${formatFileSize(this.#options.maxFileSize)})`)
          continue
        }
        try {
          if (this.#hasServerUpload) {
            await uploadFileToServer(file, this.#uploadConfig, this.#currentPath)
          } else {
            this.#localStore.addFile(this.#currentPath, file)
          }
        } catch (err) {
          errors.push(`${file.name}: ${err instanceof Error ? err.message : 'feltöltés sikertelen'}`)
        }
      }
    } finally {
      this.#setUploading(false)
    }

    if (errors.length) this.#setError(errors.join(' · '))
    else this.#setError('')

    await this.#loadDirectory(this.#currentPath)
  }

  #renderAll() {
    this.#renderPath()
    this.#renderDirsPanel()
    this.#renderFilesPanel()
    this.#renderPanelHighlight()
    this.#syncActionButtons()
    this.#renderMetadata()
  }

  /** @type {ReturnType<typeof setTimeout> | null} */
  #metadataRevealTimer = null

  #revealMetadataPanel() {
    if (!this.#selectedEntry) return
    const panel = this.#overlay?.querySelector('.bonsai-editor__file-manager-details')
    const scrollHost = this.#overlay?.querySelector('.bonsai-editor__file-manager-main')
    if (!panel) return
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    scrollHost?.scrollTo({ top: scrollHost.scrollHeight, behavior: 'smooth' })
    panel.classList.add('is-revealed')
    if (this.#metadataRevealTimer) clearTimeout(this.#metadataRevealTimer)
    this.#metadataRevealTimer = setTimeout(() => {
      panel.classList.remove('is-revealed')
      this.#metadataRevealTimer = null
    }, 1600)
  }

  #renderMetadata() {
    const body = this.#overlay?.querySelector('.bonsai-editor__file-manager-details-body')
    if (!body) return

    body.replaceChildren()
    const entry = this.#selectedEntry

    if (!entry) {
      const empty = document.createElement('p')
      empty.className = 'bonsai-editor__file-manager-details-empty'
      empty.textContent = this.#editor.t('fileManager.metadataEmpty')
      body.appendChild(empty)
      return
    }

    if (entry.kind === 'file' && isImageBrowseEntry(entry) && entry.url) {
      const preview = document.createElement('div')
      preview.className = 'bonsai-editor__file-manager-details-preview'
      const img = document.createElement('img')
      img.src = entry.url
      img.alt = entry.name
      img.loading = 'lazy'
      preview.appendChild(img)
      body.appendChild(preview)
    }

    const dl = document.createElement('dl')
    dl.className = 'bonsai-editor__file-manager-meta-dl'

    for (const row of buildBrowseEntryMetadataRows(entry, {
      t: this.#editor.t,
      locale: this.#editor.locale,
    })) {
      const dt = document.createElement('dt')
      dt.textContent = row.label

      const dd = document.createElement('dd')
      if (row.href) {
        const link = document.createElement('a')
        link.href = row.href
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.textContent = row.value
        link.className = 'bonsai-editor__file-manager-meta-link'
        dd.appendChild(link)
      } else {
        dd.textContent = row.value
      }
      if (row.mono) {
        dd.classList.add('is-mono')
      }

      dl.append(dt, dd)
    }

    body.appendChild(dl)
  }

  #renderPath() {
    const el = this.#overlay?.querySelector('.bonsai-editor__file-manager-path')
    if (!el) return
    const parts = this.#currentPath ? this.#currentPath.split('/') : []
    const crumbs = ['']
    for (const part of parts) {
      crumbs.push(joinBrowsePath(crumbs[crumbs.length - 1], part))
    }

    el.replaceChildren()
    const label = document.createElement('span')
    label.className = 'bonsai-editor__file-manager-path-label'
    label.textContent = '/'
    el.appendChild(label)

    for (let i = 1; i < crumbs.length; i += 1) {
      const sep = document.createElement('span')
      sep.className = 'bonsai-editor__file-manager-path-sep'
      sep.textContent = '/'
      el.appendChild(sep)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'bonsai-editor__file-manager-path-part'
      btn.textContent = parts[i - 1]
      const target = crumbs[i]
      btn.addEventListener('click', () => {
        void this.#navigate(target)
      })
      el.appendChild(btn)
    }
  }

  /**
   * @param {import('./sort-entries.js').FileSortKey} key
   */
  #resetFileSearch() {
    this.#fileNameFilter = ''
    const input = this.#overlay?.querySelector('.bonsai-editor__file-manager-search-input')
    if (input instanceof HTMLInputElement) input.value = ''
  }

  #focusFileSearch() {
    this.#activePanel = 'files'
    this.#renderPanelHighlight()
    const input = this.#overlay?.querySelector('.bonsai-editor__file-manager-search-input')
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
    }
  }

  #setFileSort(key) {
    if (this.#fileSortKey === key) {
      this.#fileSortDir = this.#fileSortDir === 'asc' ? 'desc' : 'asc'
    } else {
      this.#fileSortKey = key
      this.#fileSortDir = 'asc'
    }
    this.#renderFilesPanel()
  }

  #renderFileSortHeaders() {
    const labels = { name: 'Név', size: 'Méret', type: 'Típus' }
    this.#overlay?.querySelectorAll('[data-panel="files"] .bonsai-editor__file-manager-sort').forEach((btn) => {
      if (!(btn instanceof HTMLButtonElement)) return
      const key = btn.getAttribute('data-sort')
      if (key !== 'name' && key !== 'size' && key !== 'type') return
      const active = key === this.#fileSortKey
      btn.classList.toggle('is-active', active)
      const label = labels[key]
      btn.textContent = active ? `${label}${fileSortIndicator(key, this.#fileSortDir)}` : label
      btn.setAttribute('aria-sort', active ? (this.#fileSortDir === 'asc' ? 'ascending' : 'descending') : 'none')
    })
  }

  #renderDirsPanel() {
    const tbody = this.#overlay?.querySelector('[data-panel="dirs"] tbody')
    if (!tbody || !this.#listing) return
    tbody.replaceChildren()

    const dirEntries = this.#listing.entries.filter((e) => e.kind === 'parent' || e.kind === 'dir')
    for (const entry of dirEntries) {
      const tr = document.createElement('tr')
      tr.dataset.path = entry.path
      tr.dataset.kind = entry.kind
      if (this.#selectedEntry?.path === entry.path && this.#selectedEntry?.kind === entry.kind) {
        tr.classList.add('is-selected')
      }
      tr.innerHTML = `<td>${entry.kind === 'parent' ? '⬆ ..' : `📁 ${escapeHtml(entry.name)}`}</td>`

      tr.addEventListener('mousedown', (e) => e.preventDefault())
      tr.addEventListener('click', () => {
        this.#selectEntry(entry, 'dirs')
      })
      tr.addEventListener('dblclick', (e) => {
        e.preventDefault()
        void this.#navigate(entry.path)
      })
      tbody.appendChild(tr)
    }
  }

  #renderFilesPanel() {
    const tbody = this.#overlay?.querySelector('[data-panel="files"] tbody')
    if (!tbody || !this.#listing) return
    tbody.replaceChildren()

    const allFiles = this.#listing.entries.filter((e) => e.kind === 'file')
    const fileEntries = filterBrowseFilesByName(
      sortBrowseFileEntries(allFiles, this.#fileSortKey, this.#fileSortDir),
      this.#fileNameFilter,
    )
    this.#renderFileSortHeaders()

    if (!allFiles.length) {
      const tr = document.createElement('tr')
      tr.innerHTML = `<td colspan="5" class="bonsai-editor__file-manager-empty-row">${escapeHtml(this.#editor.t('fileManager.noFiles'))}</td>`
      tbody.appendChild(tr)
      return
    }

    if (!fileEntries.length) {
      const tr = document.createElement('tr')
      tr.innerHTML = `<td colspan="5" class="bonsai-editor__file-manager-empty-row">${escapeHtml(this.#editor.t('fileManager.noSearchResults'))}</td>`
      tbody.appendChild(tr)
      return
    }

    for (const entry of fileEntries) {
      const tr = document.createElement('tr')
      tr.dataset.path = entry.path
      tr.dataset.kind = 'file'
      if (this.#selectedEntry?.path === entry.path && this.#selectedEntry?.kind === 'file') {
        tr.classList.add('is-selected')
      }
      if (this.#checkedFilePaths.has(this.#fileCheckKey(entry))) {
        tr.classList.add('is-batch-selected')
      }
      const size = entry.size != null ? formatFileSize(entry.size) : '—'
      const type = entry.type || '—'

      const nameTd = document.createElement('td')
      nameTd.className = 'bonsai-editor__file-manager-name-cell'
      nameTd.textContent = entry.name

      const sizeTd = document.createElement('td')
      sizeTd.textContent = size

      const typeTd = document.createElement('td')
      typeTd.textContent = type

      tr.append(
        buildFilePreviewCell(entry),
        nameTd,
        sizeTd,
        typeTd,
        buildFileActionsCell(
          entry,
          this.#checkedFilePaths.has(this.#fileCheckKey(entry)),
          (item, checked) => this.#toggleFileChecked(item, checked),
          (item) => void this.#deleteFileRow(item),
          this.#editor.t,
        ),
      )
      if (isImageBrowseEntry(entry)) {
        tr.classList.add('is-image')
      }

      tr.addEventListener('mousedown', (e) => e.preventDefault())
      tr.addEventListener('click', (e) => {
        if (e.target instanceof Element && e.target.closest('.bonsai-editor__file-manager-file-actions')) return
        this.#selectEntry(entry, 'files')
      })
      tr.addEventListener('dblclick', (e) => {
        e.preventDefault()
        this.insertIntoDocument(entry)
      })
      tbody.appendChild(tr)
    }
  }

  #renderPanelHighlight() {
    this.#overlay?.querySelectorAll('.bonsai-editor__file-manager-panel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.getAttribute('data-panel') === this.#activePanel)
    })
  }

  #syncActionButtons() {
    const t = this.#editor.t
    const insertBtn = this.#overlay?.querySelector('[data-action="insert"]')
    const deleteBtn = this.#overlay?.querySelector('[data-action="delete"]')
    const checkedCount = this.#checkedFilePaths.size
    const canInsert = this.#selectedEntry?.kind === 'file'
    const canDelete =
      checkedCount > 0 || Boolean(this.#selectedEntry && this.#selectedEntry.kind !== 'parent')

    if (insertBtn instanceof HTMLButtonElement) {
      insertBtn.disabled = !canInsert
      insertBtn.textContent = t('fileManager.insert')
    }
    if (deleteBtn instanceof HTMLButtonElement) {
      deleteBtn.disabled = !canDelete
      deleteBtn.textContent =
        checkedCount > 0 ? t('fileManager.deleteCount', { count: checkedCount }) : t('fileManager.delete')
    }
  }

  destroy() {
    if (this.#metadataRevealTimer) clearTimeout(this.#metadataRevealTimer)
    this.#dialogDragTeardown?.()
    this.#dialogDragTeardown = null
    this.close({ restoreFocus: false })
    this.#localStore.clear()
    this.#overlay?.remove()
    this.#overlay = null
  }
}
