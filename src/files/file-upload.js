import {
  encodePathSegments,
  normalizeBrowsePath,
  parentBrowsePath,
  sanitizeUserId,
} from './path-utils.js'

/**
 * @param {string} url
 * @param {FileUploadConfig} config
 */
export function appendUserIdToRequestUrl(url, config) {
  const userId = sanitizeUserId(config.userId ?? '')
  if (!userId) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}userId=${encodeURIComponent(userId)}`
}

/**
 * @param {FileUploadConfig} config
 */
function buildRequestHeaders(config) {
  const headers = { ...(config.headers ?? {}) }
  const userId = sanitizeUserId(config.userId ?? '')
  if (userId) {
    headers['X-Bonsai-User-Id'] = userId
  }
  return headers
}

/**
 * @typedef {{
 *   id?: string;
 *   name: string;
 *   type: string;
 *   size: number;
 *   url: string;
 *   path?: string;
 *   uploadedAt?: number;
 *   remote?: boolean;
 * }} UploadedFileMeta
 */

/**
 * @typedef {{
 *   kind: 'parent' | 'dir' | 'file';
 *   name: string;
 *   path: string;
 *   size?: number;
 *   type?: string;
 *   url?: string;
 *   uploadedAt?: number;
 * }} BrowseEntry
 */

/**
 * @typedef {{
 *   path: string;
 *   parent: string;
 *   entries: BrowseEntry[];
 * }} BrowseListing
 */

/**
 * @typedef {{
 *   uploadUrl?: string;
 *   listUrl?: string;
 *   deleteUrl?: string;
 *   browseUrl?: string;
 *   createFolderUrl?: string;
 *   uploadField?: string;
 *   headers?: Record<string, string>;
 *   credentials?: RequestCredentials;
 *   upload?: (file: File, context: { path: string }) => Promise<UploadedFileMeta>;
 *   listFiles?: () => Promise<UploadedFileMeta[]>;
 *   browseDirectory?: (path: string) => Promise<BrowseListing>;
 *   createFolder?: (parentPath: string, name: string) => Promise<BrowseListing>;
 *   deleteRemoteFile?: (meta: UploadedFileMeta) => Promise<void>;
 *   deleteEntry?: (entry: BrowseEntry) => Promise<void>;
 *   userId?: string; // ha megadva: minden kérésben elküldi – backend felhasználónként szűkíthet
 * }} FileUploadConfig
 */

/**
 * @param {FileUploadConfig} config
 */
function resolveBrowseUrl(config) {
  if (config.browseUrl) return config.browseUrl
  const base = (config.listUrl ?? config.uploadUrl ?? '').replace(/\/$/, '')
  return base ? `${base}/browse` : ''
}

/**
 * @param {FileUploadConfig} config
 */
function resolveCreateFolderUrl(config) {
  if (config.createFolderUrl) return config.createFolderUrl
  const base = (config.uploadUrl ?? config.listUrl ?? '').replace(/\/$/, '')
  return base ? `${base}/folders` : ''
}

/**
 * @param {FileUploadConfig} config
 */
function resolveDeleteEntryUrl(config) {
  const base = (config.deleteUrl ?? config.uploadUrl ?? config.listUrl ?? '').replace(/\/$/, '')
  return base ? `${base}/entry` : ''
}

/**
 * @param {unknown} data
 * @param {File} file
 * @returns {UploadedFileMeta}
 */
export function normalizeUploadResponse(data, file) {
  if (typeof data === 'string') {
    return {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: data,
      remote: true,
      uploadedAt: Date.now(),
    }
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Érvénytelen feltöltési válasz.')
  }

  const obj = /** @type {Record<string, unknown>} */ (data)
  const nested = obj.file && typeof obj.file === 'object' ? /** @type {Record<string, unknown>} */ (obj.file) : obj

  const url =
    (typeof nested.url === 'string' && nested.url) ||
    (typeof nested.href === 'string' && nested.href) ||
    (typeof nested.location === 'string' && nested.location) ||
    (typeof obj.url === 'string' && obj.url)

  if (!url) {
    throw new Error('A szerver válasza nem tartalmaz url mezőt.')
  }

  return {
    id: typeof nested.id === 'string' ? nested.id : undefined,
    name: typeof nested.name === 'string' ? nested.name : file.name,
    type: typeof nested.type === 'string' ? nested.type : file.type || 'application/octet-stream',
    size: typeof nested.size === 'number' ? nested.size : file.size,
    url,
    path: typeof nested.path === 'string' ? nested.path : undefined,
    uploadedAt: typeof nested.uploadedAt === 'number' ? nested.uploadedAt : Date.now(),
    remote: true,
  }
}

/**
 * @param {FileUploadConfig} config
 * @returns {Required<Pick<FileUploadConfig, 'uploadField'>> & FileUploadConfig}
 */
export function resolveUploadConfig(config = {}) {
  const userId = sanitizeUserId(config.userId ?? '')
  return {
    uploadField: config.uploadField ?? 'file',
    ...config,
    ...(userId ? { userId } : {}),
  }
}

/**
 * @param {File} file
 * @param {FileUploadConfig} config
 * @param {string} [browsePath]
 * @returns {Promise<UploadedFileMeta>}
 */
export async function uploadFileToServer(file, config, browsePath = '') {
  const resolved = resolveUploadConfig(config)
  const path = normalizeBrowsePath(browsePath)

  if (resolved.upload) {
    return resolved.upload(file, { path })
  }

  if (!resolved.uploadUrl) {
    throw new Error('Nincs uploadUrl vagy upload handler megadva.')
  }

  const form = new FormData()
  form.append(resolved.uploadField, file, file.name)

  let uploadTarget = path
    ? `${resolved.uploadUrl}${resolved.uploadUrl.includes('?') ? '&' : '?'}path=${encodeURIComponent(path)}`
    : resolved.uploadUrl
  uploadTarget = appendUserIdToRequestUrl(uploadTarget, resolved)

  const response = await fetch(uploadTarget, {
    method: 'POST',
    body: form,
    headers: buildRequestHeaders(resolved),
    credentials: resolved.credentials,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Feltöltés sikertelen (${response.status}).`)
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()
  const meta = normalizeUploadResponse(data, file)
  if (!meta.path) meta.path = normalizeBrowsePath(`${path}/${meta.name}`)
  return meta
}

/**
 * @param {FileUploadConfig} config
 * @param {string} [browsePath]
 * @returns {Promise<BrowseListing>}
 */
export async function browseDirectory(config, browsePath = '') {
  const resolved = resolveUploadConfig(config)
  const path = normalizeBrowsePath(browsePath)

  if (resolved.browseDirectory) {
    return resolved.browseDirectory(path)
  }

  const browseUrl = resolveBrowseUrl(resolved)
  if (!browseUrl) {
    throw new Error('Nincs browseUrl vagy browseDirectory handler.')
  }

  const url = appendUserIdToRequestUrl(`${browseUrl}?path=${encodeURIComponent(path)}`, resolved)
  const response = await fetch(url, {
    method: 'GET',
    headers: buildRequestHeaders(resolved),
    credentials: resolved.credentials,
  })

  if (!response.ok) {
    throw new Error(`Könyvtár betöltése sikertelen (${response.status}).`)
  }

  const data = await response.json()
  return {
    path: typeof data.path === 'string' ? normalizeBrowsePath(data.path) : path,
    parent: typeof data.parent === 'string' ? normalizeBrowsePath(data.parent) : parentBrowsePath(path),
    entries: Array.isArray(data.entries) ? data.entries : [],
  }
}

/**
 * @param {FileUploadConfig} config
 * @param {string} parentPath
 * @param {string} name
 * @returns {Promise<BrowseListing>}
 */
export async function createFolderOnServer(config, parentPath, name) {
  const resolved = resolveUploadConfig(config)
  const parent = normalizeBrowsePath(parentPath)

  if (resolved.createFolder) {
    return resolved.createFolder(parent, name)
  }

  const createFolderUrl = resolveCreateFolderUrl(resolved)
  if (!createFolderUrl) {
    throw new Error('Nincs createFolderUrl vagy createFolder handler.')
  }

  const response = await fetch(appendUserIdToRequestUrl(createFolderUrl, resolved), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildRequestHeaders(resolved),
    },
    credentials: resolved.credentials,
    body: JSON.stringify({ path: parent, name, userId: resolved.userId }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Mappa létrehozása sikertelen (${response.status}).`)
  }

  const data = await response.json()
  if (data.listing) return data.listing
  return browseDirectory(resolved, parent)
}

/**
 * @param {FileUploadConfig} config
 * @returns {Promise<UploadedFileMeta[]>}
 */
export async function listFilesFromServer(config) {
  const resolved = resolveUploadConfig(config)

  if (resolved.listFiles) {
    return resolved.listFiles()
  }

  const browseUrl = resolveBrowseUrl(resolved)
  if (browseUrl) {
    const listing = await browseDirectory(resolved, '')
    return listing.entries
      .filter((entry) => entry.kind === 'file' && entry.url)
      .map((entry) => ({
        id: entry.path,
        name: entry.name,
        type: entry.type || 'application/octet-stream',
        size: entry.size || 0,
        url: entry.url,
        path: entry.path,
        uploadedAt: entry.uploadedAt,
        remote: true,
      }))
  }

  const listUrl = resolved.listUrl ?? resolved.uploadUrl
  if (!listUrl) return []

  const response = await fetch(appendUserIdToRequestUrl(listUrl, resolved), {
    method: 'GET',
    headers: buildRequestHeaders(resolved),
    credentials: resolved.credentials,
  })

  if (!response.ok) {
    throw new Error(`Fájllista lekérése sikertelen (${response.status}).`)
  }

  const data = await response.json()
  const files = Array.isArray(data) ? data : data?.files
  if (!Array.isArray(files)) return []

  return files
    .filter((entry) => entry && typeof entry === 'object' && typeof entry.url === 'string')
    .map((entry) => ({
      id: typeof entry.id === 'string' ? entry.id : entry.path,
      name: typeof entry.name === 'string' ? entry.name : 'fájl',
      type: typeof entry.type === 'string' ? entry.type : 'application/octet-stream',
      size: typeof entry.size === 'number' ? entry.size : 0,
      url: entry.url,
      path: typeof entry.path === 'string' ? entry.path : undefined,
      uploadedAt: typeof entry.uploadedAt === 'number' ? entry.uploadedAt : Date.now(),
      remote: true,
    }))
}

/**
 * @param {BrowseEntry} entry
 * @param {FileUploadConfig} config
 */
export async function deleteEntryOnServer(entry, config) {
  const resolved = resolveUploadConfig(config)

  if (resolved.deleteEntry) {
    await resolved.deleteEntry(entry)
    return
  }

  const deleteEntryUrl = resolveDeleteEntryUrl(resolved)
  if (deleteEntryUrl) {
    const deleteUrl = appendUserIdToRequestUrl(
      `${deleteEntryUrl}?path=${encodeURIComponent(entry.path)}`,
      resolved,
    )
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: buildRequestHeaders(resolved),
      credentials: resolved.credentials,
    })
    if (!response.ok && response.status !== 404) {
      throw new Error(`Törlés sikertelen (${response.status}).`)
    }
    return
  }

  if (entry.kind === 'file' && entry.url) {
    await deleteFileOnServer(
      {
        id: entry.path,
        name: entry.name,
        type: entry.type || 'application/octet-stream',
        size: entry.size || 0,
        url: entry.url,
        path: entry.path,
      },
      resolved,
    )
  }
}

/**
 * @param {UploadedFileMeta} item
 * @param {FileUploadConfig} config
 */
export async function deleteFileOnServer(item, config) {
  const resolved = resolveUploadConfig(config)

  if (resolved.deleteRemoteFile) {
    await resolved.deleteRemoteFile(item)
    return
  }

  if (!resolved.deleteUrl || !item.id) return

  const base = resolved.deleteUrl.replace(/\/$/, '')
  const response = await fetch(appendUserIdToRequestUrl(`${base}/${encodeURIComponent(item.id)}`, resolved), {
    method: 'DELETE',
    headers: buildRequestHeaders(resolved),
    credentials: resolved.credentials,
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Törlés sikertelen (${response.status}).`)
  }
}

export { encodePathSegments }
