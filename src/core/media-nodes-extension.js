import { Node, mergeAttributes } from '@tiptap/core'
import { getVimeoEmbedUrl, isVimeoMediaUrl } from './media-url-utils.js'

const ALLOWED_IFRAME_HOSTS = new Set(['player.vimeo.com'])

/**
 * @param {string} src
 */
function isAllowedEmbedSrc(src) {
  try {
    const { protocol, hostname } = new URL(src)
    if (protocol !== 'https:') return false
    return ALLOWED_IFRAME_HOSTS.has(hostname.replace(/^www\./, ''))
  } catch {
    return false
  }
}

export const MediaEmbed = Node.create({
  name: 'mediaEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-bonsai-media-embed] iframe[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-bonsai-media-embed': '', class: 'bonsai-media-embed' },
      [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          class: 'bonsai-media-embed__frame',
          frameborder: '0',
          allow:
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          loading: 'lazy',
        }),
      ],
    ]
  },

  addCommands() {
    return {
      setMediaEmbed:
        (options) =>
        ({ commands }) => {
          const src = options?.src
          if (!src || !isAllowedEmbedSrc(src)) return false
          return commands.insertContent({
            type: this.name,
            attrs: { src, title: options.title ?? null },
          })
        },
    }
  },
})

export const MediaVideo = Node.create({
  name: 'mediaVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'video[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        class: 'bonsai-media-video',
        controls: 'true',
        preload: 'metadata',
      }),
    ]
  },

  addCommands() {
    return {
      setMediaVideo:
        (options) =>
        ({ commands }) => {
          if (!options?.src) return false
          return commands.insertContent({
            type: this.name,
            attrs: { src: options.src, title: options.title ?? null },
          })
        },
    }
  },
})

export const MediaAudio = Node.create({
  name: 'mediaAudio',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'audio[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'audio',
      mergeAttributes(HTMLAttributes, {
        class: 'bonsai-media-audio',
        controls: 'true',
        preload: 'metadata',
      }),
    ]
  },

  addCommands() {
    return {
      setMediaAudio:
        (options) =>
        ({ commands }) => {
          if (!options?.src) return false
          return commands.insertContent({
            type: this.name,
            attrs: { src: options.src, title: options.title ?? null },
          })
        },
    }
  },
})

/**
 * @param {import('@tiptap/core').Editor} editor
 * @param {string} url
 * @param {import('./media-url-utils.js').MediaKind} kind
 * @param {{ title?: string }} [options]
 */
export function insertMediaByKind(editor, url, kind, options = {}) {
  const title = options.title?.trim() || null
  const chain = editor.chain().focus()

  switch (kind) {
    case 'youtube':
      return chain.setYoutubeVideo({ src: url }).run()
    case 'vimeo': {
      const embed = getVimeoEmbedUrl(url)
      if (!embed || !isVimeoMediaUrl(url)) return false
      return chain.setMediaEmbed({ src: embed, title }).run()
    }
    case 'image':
      return chain.setImage({ src: url, alt: title ?? '', title: title ?? undefined }).run()
    case 'video':
      return chain.setMediaVideo({ src: url, title }).run()
    case 'audio':
      return chain.setMediaAudio({ src: url, title }).run()
    default:
      return false
  }
}
