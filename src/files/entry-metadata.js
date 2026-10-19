import { formatFileSize } from './file-store.js'
import { INTL_DATE_LOCALES, resolveLocale } from '../i18n/index.js'

/**
 * @param {import('./file-upload.js').BrowseEntry} entry
 */
export function isImageBrowseEntry(entry) {
  if ((entry.type || '').startsWith('image/')) return true
  return /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(entry.name)
}

/**
 * @typedef {{ label: string; value: string; href?: string; mono?: boolean }} MetadataRow
 */

/**
 * @param {number | undefined} ms
 * @param {string} [locale]
 */
export function formatMetadataTimestamp(ms, locale = 'hu-HU') {
  if (ms == null || !Number.isFinite(ms)) return '—'
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ms))
  } catch {
    return new Date(ms).toISOString()
  }
}

/**
 * @param {import('./file-upload.js').BrowseEntry} entry
 * @param {{ t?: import('../i18n/index.js').TranslateFn; locale?: string }} [options]
 * @returns {MetadataRow[]}
 */
export function buildBrowseEntryMetadataRows(entry, options = {}) {
  const t = options.t
  const dateLocale =
    INTL_DATE_LOCALES[resolveLocale(options.locale)] ?? INTL_DATE_LOCALES.hu

  const L = (key, fb) => (t ? t(key) : fb)

  if (entry.kind === 'parent') {
    return [
      { label: L('meta.type', 'Típus'), value: L('meta.parentKind', 'Szülő könyvtár') },
      { label: L('meta.target', 'Cél'), value: entry.path || '/' },
      { label: L('meta.path', 'Útvonal'), value: entry.path || '—', mono: true },
    ]
  }

  if (entry.kind === 'dir') {
    return [
      { label: L('meta.type', 'Típus'), value: L('meta.folderKind', 'Mappa') },
      { label: L('meta.name', 'Név'), value: entry.name },
      { label: L('meta.path', 'Útvonal'), value: entry.path || '—', mono: true },
    ]
  }

  /** @type {MetadataRow[]} */
  const rows = [
    {
      label: L('meta.type', 'Típus'),
      value: isImageBrowseEntry(entry) ? L('meta.imageKind', 'Képfájl') : L('meta.fileKind', 'Fájl'),
    },
    { label: L('meta.name', 'Név'), value: entry.name },
    { label: L('meta.mime', 'MIME'), value: entry.type || '—', mono: true },
    {
      label: L('meta.size', 'Méret'),
      value:
        entry.size != null
          ? t
            ? t('meta.bytesDetail', {
                formatted: formatFileSize(entry.size),
                raw: String(entry.size),
              })
            : `${formatFileSize(entry.size)} (${entry.size} bájt)`
          : '—',
    },
    { label: L('meta.path', 'Útvonal'), value: entry.path || entry.name, mono: true },
  ]

  if (entry.url) {
    rows.push({ label: L('meta.url', 'URL'), value: entry.url, href: entry.url, mono: true })
  }

  if (entry.uploadedAt != null) {
    rows.push({
      label: L('meta.uploaded', 'Feltöltve'),
      value: formatMetadataTimestamp(entry.uploadedAt, dateLocale),
    })
  }

  return rows
}
