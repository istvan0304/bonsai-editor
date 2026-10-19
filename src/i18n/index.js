import { MESSAGES } from './messages.js'

/** @typedef {'hu' | 'en' | 'de' | 'es' | 'it'} BonsaiLocale */

export const SUPPORTED_LOCALES = /** @type {const} */ (['hu', 'en', 'de', 'es', 'it'])

export const DEFAULT_LOCALE = /** @type {BonsaiLocale} */ ('hu')

/** @type {Record<BonsaiLocale, string>} */
export const LOCALE_LABELS = {
  hu: 'Magyar',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
}

/** @type {Record<BonsaiLocale, string>} */
export const INTL_DATE_LOCALES = {
  hu: 'hu-HU',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
}

/**
 * @param {unknown} input
 * @returns {BonsaiLocale}
 */
export function resolveLocale(input) {
  const raw = String(input ?? DEFAULT_LOCALE)
    .trim()
    .toLowerCase()
    .replace('_', '-')
  const base = raw.split('-')[0]
  if (SUPPORTED_LOCALES.includes(/** @type {BonsaiLocale} */ (base))) {
    return /** @type {BonsaiLocale} */ (base)
  }
  return DEFAULT_LOCALE
}

/**
 * @param {MessageTree} tree
 * @param {string} path
 */
function getMessage(tree, path) {
  return path.split('.').reduce((node, key) => {
    if (node && typeof node === 'object' && key in node) {
      return /** @type {MessageTree} */ (node)[key]
    }
    return undefined
  }, /** @type {unknown} */ (tree))
}

/**
 * @param {BonsaiLocale} locale
 */
export function createTranslator(locale) {
  const resolved = resolveLocale(locale)
  const dict = MESSAGES[resolved] ?? MESSAGES.hu
  const fallback = MESSAGES.hu

  /**
   * @param {string} key
   * @param {Record<string, string | number> | undefined} [params]
   */
  function t(key, params) {
    let value = getMessage(dict, key) ?? getMessage(fallback, key)
    if (typeof value !== 'string') return key
    if (params) {
      for (const [name, val] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, String(val))
      }
    }
    return value
  }

  return t
}

/** @typedef {ReturnType<typeof createTranslator>} TranslateFn */
