/** @typedef {'image' | 'youtube' | 'vimeo' | 'video' | 'audio'} MediaKind */

const ALLOWED_PROTOCOLS = ['http:', 'https:']

const IMAGE_EXT = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?|#|$)/i
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?|#|$)/i
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i
const YOUTUBE_RE =
  /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu\.be|youtube-nocookie\.com))(\/(?:[\w-]+\?v=|embed\/|v\/|shorts\/|live\/)?)([\w-]+)(\S+)?$/i
const VIMEO_RE = /^((?:https?:)?\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(\/)?(\S+)?$/i

/**
 * @param {string} raw
 */
export function normalizeMediaUrl(raw) {
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  if (!isAllowedHttpUrl(withProtocol)) return null
  try {
    return new URL(withProtocol).href
  } catch {
    return null
  }
}

/**
 * @param {string} url
 */
function isAllowedHttpUrl(url) {
  const trimmed = String(url).trim()
  if (!/^(https?:|mailto:|tel:)/i.test(trimmed)) return false
  if (!/^https?:/i.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed, 'https://example.com')
    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * @param {string} url
 */
export function isYoutubeMediaUrl(url) {
  return YOUTUBE_RE.test(url)
}

/**
 * @param {string} url
 */
export function isVimeoMediaUrl(url) {
  return VIMEO_RE.test(url)
}

/**
 * @param {string} url
 */
export function isImageMediaUrl(url) {
  if (isYoutubeMediaUrl(url) || isVimeoMediaUrl(url)) return false
  try {
    const { pathname } = new URL(url)
    return IMAGE_EXT.test(pathname)
  } catch {
    return false
  }
}

/**
 * @param {string} url
 */
export function isVideoFileMediaUrl(url) {
  try {
    const { pathname } = new URL(url)
    return VIDEO_EXT.test(pathname)
  } catch {
    return false
  }
}

/**
 * @param {string} url
 */
export function isAudioFileMediaUrl(url) {
  try {
    const { pathname } = new URL(url)
    return AUDIO_EXT.test(pathname)
  } catch {
    return false
  }
}

/**
 * @param {string} url
 * @returns {MediaKind | null}
 */
export function detectMediaKind(url) {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return null
  if (isYoutubeMediaUrl(normalized)) return 'youtube'
  if (isVimeoMediaUrl(normalized)) return 'vimeo'
  if (isImageMediaUrl(normalized)) return 'image'
  if (isVideoFileMediaUrl(normalized)) return 'video'
  if (isAudioFileMediaUrl(normalized)) return 'audio'
  return null
}

/**
 * @param {string} url
 */
export function getVimeoEmbedUrl(url) {
  const match = url.match(VIMEO_RE)
  const id = match?.[2]
  if (!id) return null
  return `https://player.vimeo.com/video/${id}`
}

/**
 * @param {MediaKind} kind
 */
/**
 * @param {import('./media-url-utils.js').MediaKind} kind
 * @param {import('../i18n/index.js').TranslateFn} [t]
 */
export function mediaKindLabel(kind, t) {
  if (t) {
    const key = /** @type {Record<string, string>} */ ({
      image: 'media.kindImage',
      youtube: 'media.kindYoutube',
      vimeo: 'media.kindVimeo',
      video: 'media.kindVideo',
      audio: 'media.kindAudio',
    })[kind]
    if (key) return t(key)
    return t('media.kindGeneric')
  }
  switch (kind) {
    case 'image':
      return 'Kép'
    case 'youtube':
      return 'YouTube'
    case 'vimeo':
      return 'Vimeo'
    case 'video':
      return 'Videó'
    case 'audio':
      return 'Hang'
    default:
      return 'Média'
  }
}

/**
 * @param {string} raw
 * @param {import('../i18n/index.js').TranslateFn} [t]
 */
export function describeMediaUrlError(raw, t) {
  const trimmed = String(raw).trim()
  if (!trimmed) return t?.('error.mediaUrlEmpty') ?? 'Adj meg egy URL-t.'
  if (!normalizeMediaUrl(trimmed)) {
    return t?.('error.mediaUrlInvalid') ?? 'Csak http(s) URL engedélyezett.'
  }
  return (
    t?.('error.mediaUrlUnknown') ??
    'Ismeretlen média URL. Támogatott: kép (.jpg, .png…), YouTube, Vimeo, videó (.mp4…), hang (.mp3…).'
  )
}
