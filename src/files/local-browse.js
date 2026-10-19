import { joinBrowsePath, normalizeBrowsePath, parentBrowsePath, sanitizeFolderName } from './path-utils.js'
import { formatFileSize } from './file-store.js'

/**
 * @typedef {import('./file-upload.js').BrowseEntry} BrowseEntry
 * @typedef {import('./file-upload.js').BrowseListing} BrowseListing
 */

export class LocalBrowseStore {
  /** @type {Set<string>} */
  #folders = new Set()

  /** @type {Map<string, { id: string; name: string; type: string; size: number; url: string; uploadedAt: number; path: string }>} */
  #files = new Map()

  /**
   * @param {string} [browsePath]
   * @returns {BrowseListing}
   */
  browse(browsePath = '') {
    const path = normalizeBrowsePath(browsePath)
    /** @type {BrowseEntry[]} */
    const entries = []

    if (path) {
      entries.push({ kind: 'parent', name: '..', path: parentBrowsePath(path) })
    }

    const childFolders = [...this.#folders]
      .filter((folderPath) => {
        const parent = parentBrowsePath(folderPath)
        return parent === path && folderPath !== path
      })
      .map((folderPath) => folderPath.split('/').pop())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'hu'))

    for (const name of childFolders) {
      entries.push({
        kind: 'dir',
        name,
        path: joinBrowsePath(path, name),
      })
    }

    for (const file of this.#files.values()) {
      if (normalizeBrowsePath(file.path) !== path) continue
      entries.push({
        kind: 'file',
        name: file.name,
        path: joinBrowsePath(path, file.name),
        size: file.size,
        type: file.type,
        url: file.url,
        uploadedAt: file.uploadedAt,
      })
    }

    return { path, parent: parentBrowsePath(path), entries }
  }

  /**
   * @param {string} parentPath
   * @param {string} name
   */
  createFolder(parentPath, name) {
    const folderName = sanitizeFolderName(name)
    if (!folderName) throw new Error('Érvénytelen mappa név.')
    const full = joinBrowsePath(parentPath, folderName)
    this.#folders.add(full)
    return this.browse(parentPath)
  }

  /**
   * @param {string} browsePath
   * @param {File} file
   */
  addFile(browsePath, file) {
    const path = normalizeBrowsePath(browsePath)
    const id = crypto.randomUUID?.() ?? `local-${Date.now()}`
    const url = URL.createObjectURL(file)
    const entry = {
      id,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url,
      uploadedAt: Date.now(),
      path,
    }
    this.#files.set(id, entry)
    return entry
  }

  /**
   * @param {BrowseEntry} entry
   */
  removeEntry(entry) {
    if (entry.kind === 'dir') {
      const prefix = `${entry.path}/`
      for (const folder of [...this.#folders]) {
        if (folder === entry.path || folder.startsWith(prefix)) {
          this.#folders.delete(folder)
        }
      }
      for (const [id, file] of [...this.#files.entries()]) {
        if (file.path === entry.path || file.path.startsWith(prefix)) {
          URL.revokeObjectURL(file.url)
          this.#files.delete(id)
        }
      }
      this.#folders.delete(entry.path)
      return
    }

    if (entry.kind === 'file') {
      const entryPath = normalizeBrowsePath(entry.path)
      for (const [id, file] of this.#files.entries()) {
        const storedFullPath = joinBrowsePath(file.path, file.name)
        if (storedFullPath === entryPath) {
          URL.revokeObjectURL(file.url)
          this.#files.delete(id)
          return
        }
      }
    }
  }

  clear() {
    for (const file of this.#files.values()) {
      URL.revokeObjectURL(file.url)
    }
    this.#files.clear()
    this.#folders.clear()
  }
}

export { formatFileSize }
