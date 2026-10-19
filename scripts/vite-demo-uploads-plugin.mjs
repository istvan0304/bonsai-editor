import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Busboy from 'busboy'
import { sanitizeUserId } from '../src/files/path-utils.js'

const pluginRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(pluginRoot, '..')

/**
 * @param {string} input
 */
function normalizeBrowsePath(input = '') {
  const parts = String(input).replace(/\\/g, '/').split('/').filter(Boolean)
  return parts.filter((part) => part !== '..' && part !== '.').join('/')
}

/**
 * @param {string} browsePath
 */
function parentBrowsePath(browsePath) {
  const normalized = normalizeBrowsePath(browsePath)
  if (!normalized) return ''
  const parts = normalized.split('/')
  parts.pop()
  return parts.join('/')
}

/**
 * @param {string} base
 * @param {string} name
 */
function joinBrowsePath(base, name) {
  const left = normalizeBrowsePath(base)
  const right = normalizeBrowsePath(name)
  if (!right) return left
  return left ? `${left}/${right}` : right
}

/**
 * @param {string} name
 */
function sanitizeFolderName(name) {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

/**
 * @param {string} name
 */
function sanitizeFileName(name) {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim()
  return base.slice(0, 200) || 'fájl'
}

/**
 * @param {string} filename
 */
function guessMime(filename) {
  const ext = path.extname(filename).toLowerCase()
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.json': 'application/json',
  }
  return map[ext] || 'application/octet-stream'
}

/**
 * @param {{ uploadDir?: string; apiPrefix?: string }} [options]
 */
export function demoUploadsPlugin(options = {}) {
  const uploadDir = options.uploadDir ?? path.join(projectRoot, '.demo-uploads')
  const apiPrefix = options.apiPrefix ?? '/api/uploads'
  const rawRoute = `${apiPrefix}/raw`

  /** @type {Promise<void> | null} */
  let ready = null

  async function ensureReady() {
    if (!ready) {
      ready = fsp.mkdir(uploadDir, { recursive: true })
    }
    await ready
  }

  /**
   * @param {string} userId
   */
  function storageRootForUser(userId) {
    const safe = sanitizeUserId(userId)
    if (!safe) return uploadDir
    return path.join(uploadDir, '_users', safe)
  }

  /**
   * @param {URL} url
   * @param {import('http').IncomingMessage} req
   */
  function resolveRequestUserId(url, req) {
    const fromQuery = sanitizeUserId(url.searchParams.get('userId') || '')
    if (fromQuery) return fromQuery
    const header = req.headers['x-bonsai-user-id']
    if (typeof header === 'string') return sanitizeUserId(header)
    return ''
  }

  /**
   * @param {string} storageRoot
   * @param {string} browsePath
   */
  function resolvePhysicalDir(storageRoot, browsePath) {
    const normalized = normalizeBrowsePath(browsePath)
    const dir = path.resolve(storageRoot, normalized)
    const root = path.resolve(storageRoot)
    if (!dir.startsWith(root)) {
      throw new Error('Érvénytelen útvonal.')
    }
    return dir
  }

  /**
   * @param {string} storageRoot
   * @param {string} browsePath
   */
  function resolvePhysicalFile(storageRoot, browsePath) {
    const normalized = normalizeBrowsePath(browsePath)
    const filePath = path.resolve(storageRoot, normalized)
    const root = path.resolve(storageRoot)
    if (!filePath.startsWith(root)) {
      throw new Error('Érvénytelen útvonal.')
    }
    return filePath
  }

  /**
   * @param {string} rel
   * @param {string} userId
   */
  function buildRawFileUrl(rel, userId) {
    const encoded = rel
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')
    let url = `${rawRoute}/${encoded}`
    const safe = sanitizeUserId(userId)
    if (safe) {
      url += `?userId=${encodeURIComponent(safe)}`
    }
    return url
  }

  function sendJson(res, status, body) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
  }

  /**
   * @param {string} browsePath
   * @param {string} storageRoot
   * @param {string} userId
   */
  async function listDirectory(browsePath, storageRoot, userId) {
    await ensureReady()
    const normalized = normalizeBrowsePath(browsePath)
    const dir = resolvePhysicalDir(storageRoot, normalized)
    await fsp.mkdir(dir, { recursive: true })

    /** @type {Array<Record<string, unknown>>} */
    const entries = []
    if (normalized) {
      entries.push({
        kind: 'parent',
        name: '..',
        path: parentBrowsePath(normalized),
      })
    }

    const names = await fsp.readdir(dir)
    names.sort((a, b) => a.localeCompare(b, 'hu'))

    for (const name of names) {
      if (name === 'manifest.json') continue
      const full = path.join(dir, name)
      const stat = await fsp.stat(full)
      const rel = joinBrowsePath(normalized, name)
      if (stat.isDirectory()) {
        entries.push({ kind: 'dir', name, path: rel })
        continue
      }
      entries.push({
        kind: 'file',
        name,
        path: rel,
        size: stat.size,
        type: guessMime(name),
        url: buildRawFileUrl(rel, userId),
        uploadedAt: stat.mtimeMs,
      })
    }

    return {
      path: normalized,
      parent: parentBrowsePath(normalized),
      entries,
    }
  }

  /**
   * @param {import('http').IncomingMessage} req
   * @param {string} targetDir
   */
  function parseUpload(req, targetDir) {
    return new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers })
      /** @type {Promise<{ name: string; type: string; size: number; savedPath: string }> | null} */
      let pending = null

      busboy.on('file', (field, file, info) => {
        if (field !== 'file' && field !== 'upload') {
          file.resume()
          return
        }
        if (pending) {
          file.resume()
          return
        }

        const safeName = sanitizeFileName(info.filename || 'fájl')
        const savedPath = path.join(targetDir, safeName)
        let size = 0

        pending = new Promise((resFile, rejFile) => {
          const out = createWriteStream(savedPath)
          file.on('data', (chunk) => {
            size += chunk.length
          })
          file.pipe(out)
          out.on('error', rejFile)
          out.on('finish', () => {
            resFile({
              name: safeName,
              type: info.mimeType || guessMime(safeName),
              size,
              savedPath,
            })
          })
          file.on('error', rejFile)
        })
      })

      busboy.on('error', reject)
      busboy.on('finish', () => {
        if (!pending) {
          reject(new Error('Nincs fájl a kérésben.'))
          return
        }
        pending.then(resolve).catch(reject)
      })

      req.pipe(busboy)
    })
  }

  /**
   * @param {import('http').IncomingMessage} req
   */
  async function readJsonBody(req) {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const raw = Buffer.concat(chunks).toString('utf8')
    return raw ? JSON.parse(raw) : {}
  }

  return {
    name: 'bonsai-demo-uploads',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url ? new URL(req.url, 'http://localhost') : null
          if (!url) return next()

          if (url.pathname === `${apiPrefix}/browse` && req.method === 'GET') {
            const userId = resolveRequestUserId(url, req)
            const storageRoot = storageRootForUser(userId)
            const browsePath = normalizeBrowsePath(url.searchParams.get('path') || '')
            const listing = await listDirectory(browsePath, storageRoot, userId)
            return sendJson(res, 200, listing)
          }

          if (url.pathname === `${apiPrefix}/folders` && req.method === 'POST') {
            const body = await readJsonBody(req)
            const userId = resolveRequestUserId(url, req) || sanitizeUserId(body.userId || '')
            const storageRoot = storageRootForUser(userId)
            const parent = normalizeBrowsePath(body.path || '')
            const name = sanitizeFolderName(body.name || '')
            if (!name) {
              return sendJson(res, 400, { error: 'Érvénytelen mappa név.' })
            }
            const target = resolvePhysicalDir(storageRoot, joinBrowsePath(parent, name))
            await fsp.mkdir(target, { recursive: true })
            const listing = await listDirectory(parent, storageRoot, userId)
            return sendJson(res, 201, {
              folder: { kind: 'dir', name, path: joinBrowsePath(parent, name) },
              listing,
            })
          }

          if (url.pathname === apiPrefix && req.method === 'POST') {
            await ensureReady()
            const userId = resolveRequestUserId(url, req)
            const storageRoot = storageRootForUser(userId)
            const browsePath = normalizeBrowsePath(url.searchParams.get('path') || '')
            const targetDir = resolvePhysicalDir(storageRoot, browsePath)
            await fsp.mkdir(targetDir, { recursive: true })

            const contentType = req.headers['content-type'] || ''
            if (!contentType.includes('multipart/form-data')) {
              return sendJson(res, 400, { error: 'multipart/form-data szükséges' })
            }

            const saved = await parseUpload(req, targetDir)
            const rel = joinBrowsePath(browsePath, saved.name)

            return sendJson(res, 201, {
              file: {
                kind: 'file',
                name: saved.name,
                path: rel,
                type: saved.type,
                size: saved.size,
                url: buildRawFileUrl(rel, userId),
                uploadedAt: Date.now(),
              },
            })
          }

          if (url.pathname.startsWith(`${rawRoute}/`) && req.method === 'GET') {
            const userId = resolveRequestUserId(url, req)
            const storageRoot = storageRootForUser(userId)
            const relEncoded = url.pathname.slice(rawRoute.length + 1)
            const rel = relEncoded
              .split('/')
              .map((segment) => decodeURIComponent(segment))
              .join('/')
            const filePath = resolvePhysicalFile(storageRoot, rel)
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
              res.statusCode = 404
              return res.end('Not found')
            }
            res.statusCode = 200
            res.setHeader('Content-Type', guessMime(path.basename(filePath)))
            return createReadStream(filePath).pipe(res)
          }

          if (url.pathname === `${apiPrefix}/entry` && req.method === 'DELETE') {
            const userId = resolveRequestUserId(url, req)
            const storageRoot = storageRootForUser(userId)
            const entryPath = normalizeBrowsePath(url.searchParams.get('path') || '')
            if (!entryPath) {
              return sendJson(res, 400, { error: 'Hiányzó path.' })
            }
            const physical = resolvePhysicalFile(storageRoot, entryPath)
            if (!fs.existsSync(physical)) {
              return sendJson(res, 404, { error: 'Nincs ilyen bejegyzés.' })
            }
            const stat = await fsp.stat(physical)
            if (stat.isDirectory()) {
              const contents = await fsp.readdir(physical)
              if (contents.length > 0) {
                return sendJson(res, 400, { error: 'A mappa nem üres.' })
              }
              await fsp.rmdir(physical)
            } else {
              await fsp.unlink(physical)
            }
            return sendJson(res, 200, { ok: true })
          }

          if (url.pathname === apiPrefix && req.method === 'GET') {
            const userId = resolveRequestUserId(url, req)
            const storageRoot = storageRootForUser(userId)
            const listing = await listDirectory('', storageRoot, userId)
            const files = listing.entries.filter((entry) => entry.kind === 'file')
            return sendJson(res, 200, { files, path: '', entries: listing.entries })
          }

          return next()
        } catch (err) {
          console.error('[demo-uploads]', err)
          return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Belső hiba' })
        }
      })
    },
  }
}
