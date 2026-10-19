import {
  describeMediaUrlError,
  detectMediaKind,
  normalizeMediaUrl,
} from './media-url-utils.js'
import { insertMediaByKind } from './media-nodes-extension.js'

/**
 * @typedef {import('./editor.js').BonsaiEditor} BonsaiEditor
 */

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {string} rawUrl
 * @param {{ title?: string }} [options]
 */
/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {string} rawUrl
 * @param {{ title?: string }} [options]
 * @param {import('../i18n/index.js').TranslateFn} [t]
 */
export function insertMediaFromUrl(editor, rawUrl, options = {}, t) {
  const url = normalizeMediaUrl(rawUrl)
  if (!url) {
    throw new Error(describeMediaUrlError(rawUrl, t))
  }

  const kind = detectMediaKind(url)
  if (!kind) {
    throw new Error(describeMediaUrlError(rawUrl, t))
  }

  const ok = insertMediaByKind(editor, url, kind, options)
  if (!ok) {
    throw new Error(t?.('error.mediaInsertFailed') ?? 'A média beszúrása sikertelen.')
  }

  return { url, kind }
}

/**
 * @param {BonsaiEditor} bonsaiEditor
 * @param {string} rawUrl
 * @param {{ title?: string }} [options]
 */
export function insertMediaIntoEditor(bonsaiEditor, rawUrl, options = {}, t) {
  const translate = t ?? bonsaiEditor.t
  return insertMediaFromUrl(bonsaiEditor.tiptap, rawUrl, options, translate)
}
