/**
 * @param {string} [input]
 * @returns {string}
 */
export function normalizeBrowsePath(input = '') {
  const parts = String(input).replace(/\\/g, '/').split('/').filter(Boolean)
  const safe = parts.filter((part) => part !== '..' && part !== '.' && part !== '')
  return safe.join('/')
}

/**
 * @param {string} path
 * @returns {string}
 */
export function parentBrowsePath(path) {
  const normalized = normalizeBrowsePath(path)
  if (!normalized) return ''
  const parts = normalized.split('/')
  parts.pop()
  return parts.join('/')
}

/**
 * @param {string} base
 * @param {string} name
 * @returns {string}
 */
export function joinBrowsePath(base, name) {
  const left = normalizeBrowsePath(base)
  const right = normalizeBrowsePath(name)
  if (!right) return left
  return left ? `${left}/${right}` : right
}

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFolderName(name) {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

/**
 * Fájltároló azonosító (pl. bejelentkezett felhasználó). Üres, ha érvénytelen.
 * @param {string} userId
 */
export function sanitizeUserId(userId) {
  const trimmed = String(userId ?? '').trim()
  if (!trimmed) return ''
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 128)
  return safe
}

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFileName(name) {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim()
  return base.slice(0, 200) || 'fájl'
}

/**
 * @param {string} path
 */
export function encodePathSegments(path) {
  return normalizeBrowsePath(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}
