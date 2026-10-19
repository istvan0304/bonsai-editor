import mammoth from './mammoth-browser.js'

/** @typedef {{ type: string; message: string }} WordImportMessage */
/** @typedef {{ html: string; messages: WordImportMessage[] }} WordImportResult */

export const DOCX_ACCEPT =
  '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * @typedef {'replace' | 'insert'} WordImportMode
 * @typedef {{
 *   mode?: WordImportMode;
 *   confirmReplace?: boolean;
 * }} WordImportApplyOptions
 */

/**
 * @param {File | Blob} file
 */
export function isLegacyDocFile(file) {
  const name = 'name' in file ? String(file.name).toLowerCase() : ''
  return name.endsWith('.doc') && !name.endsWith('.docx')
}

/**
 * @param {File | Blob} file
 */
export function isDocxFile(file) {
  if (isLegacyDocFile(file)) return false
  const name = 'name' in file ? String(file.name) : ''
  const type = String(file.type || '').toLowerCase()
  if (type === DOCX_MIME) return true
  return name.toLowerCase().endsWith('.docx')
}

/**
 * @param {string} html
 */
export function normalizeWordHtml(html) {
  const trimmed = String(html).trim()
  if (!trimmed) return '<p></p>'
  return trimmed
}

/**
 * @param {unknown} error
 */
export function formatWordImportError(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @param {Record<string, unknown>} [convertOptions]
 */
/**
 * @param {ArrayBuffer} arrayBuffer
 */
function cloneArrayBuffer(arrayBuffer) {
  const src = new Uint8Array(arrayBuffer)
  const copy = new Uint8Array(src.byteLength)
  copy.set(src)
  return copy.buffer
}

async function mammothConvertToHtml(arrayBuffer, convertOptions) {
  const imageOptions = {
    convertImage: mammoth.images.dataUri,
    ...convertOptions,
  }
  return mammoth.convertToHtml({ arrayBuffer: cloneArrayBuffer(arrayBuffer) }, imageOptions)
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<WordImportResult>}
 */
export async function convertDocxArrayBufferToHtml(arrayBuffer) {
  const result = await mammothConvertToHtml(arrayBuffer)

  return {
    html: normalizeWordHtml(result.value),
    messages: result.messages,
  }
}

/**
 * @param {File | Blob} file
 * @returns {Promise<WordImportResult>}
 */
export async function convertDocxFileToHtml(file) {
  if (isLegacyDocFile(file)) {
    throw new Error(
      'A régi .doc formátum nem támogatott. Wordben mentsd „Word dokumentum (.docx)” formátumban, majd importáld újra.',
    )
  }
  if (!isDocxFile(file)) {
    throw new Error('Csak .docx (Word) fájl importálható.')
  }
  const buffer = await file.arrayBuffer()
  return convertDocxArrayBufferToHtml(buffer)
}

/**
 * @returns {Promise<File | null>}
 */
export function pickDocxFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = DOCX_ACCEPT
    input.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;'
    document.body.appendChild(input)

    let settled = false

    const finish = (/** @type {File | null} */ file) => {
      if (settled) return
      settled = true
      window.removeEventListener('focus', onWindowFocus)
      setTimeout(() => input.remove(), 0)
      resolve(file)
    }

    const onWindowFocus = () => {
      setTimeout(() => {
        if (settled) return
        if (!input.files?.length) finish(null)
      }, 800)
    }

    input.addEventListener(
      'change',
      () => {
        finish(input.files?.[0] ?? null)
      },
      { once: true },
    )

    window.addEventListener('focus', onWindowFocus, { once: true })
    input.click()
  })
}
