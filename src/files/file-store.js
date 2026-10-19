/** @typedef {{ id: string; name: string; type: string; size: number; url: string; uploadedAt: number; local?: boolean; remoteId?: string }} StoredFile */

let nextId = 0

/**
 * @returns {string}
 */
function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  nextId += 1
  return `file-${Date.now()}-${nextId}`
}

/**
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export class FileStore {
  /** @type {Map<string, StoredFile>} */
  #files = new Map()

  /** @returns {StoredFile[]} */
  list() {
    return [...this.#files.values()].sort((a, b) => b.uploadedAt - a.uploadedAt)
  }

  /**
   * @param {string} id
   * @returns {StoredFile | undefined}
   */
  get(id) {
    return this.#files.get(id)
  }

  /**
   * @param {File} file
   * @returns {StoredFile}
   */
  addLocal(file) {
    const id = createId()
    const url = URL.createObjectURL(file)
    /** @type {StoredFile} */
    const entry = {
      id,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url,
      uploadedAt: Date.now(),
      local: true,
    }
    this.#files.set(id, entry)
    return entry
  }

  /**
   * @param {import('./file-upload.js').UploadedFileMeta} meta
   * @returns {StoredFile}
   */
  addRemote(meta) {
    const id = meta.id ?? createId()
    /** @type {StoredFile} */
    const entry = {
      id,
      remoteId: meta.id,
      name: meta.name,
      type: meta.type,
      size: meta.size,
      url: meta.url,
      uploadedAt: meta.uploadedAt ?? Date.now(),
      local: false,
    }
    this.#files.set(id, entry)
    return entry
  }

  /** @param {import('./file-upload.js').UploadedFileMeta[]} entries */
  replaceRemoteList(entries) {
    for (const [key, entry] of [...this.#files.entries()]) {
      if (!entry.local) this.#files.delete(key)
    }
    for (const meta of entries) {
      this.addRemote(meta)
    }
  }

  /** @param {File} file */
  add(file) {
    return this.addLocal(file)
  }

  /**
   * @param {StoredFile} entry
   */
  #revokeIfLocal(entry) {
    if (entry.local) {
      URL.revokeObjectURL(entry.url)
    }
  }

  /**
   * @param {string} id
   * @returns {StoredFile | undefined}
   */
  remove(id) {
    const entry = this.#files.get(id)
    if (!entry) return undefined
    this.#revokeIfLocal(entry)
    this.#files.delete(id)
    return entry
  }

  clear() {
    for (const entry of this.#files.values()) {
      this.#revokeIfLocal(entry)
    }
    this.#files.clear()
  }
}
