import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import { BackgroundColor, Color, FontFamily, LineHeight, TextStyle } from '@tiptap/extension-text-style'
import { LetterSpacing } from './letter-spacing-extension.js'
import { TextIndent } from './text-indent-extension.js'
import { BonsaiImage } from './image-extension.js'
import { TableKit } from '@tiptap/extension-table'
import Youtube from '@tiptap/extension-youtube'
import { MediaAudio, MediaEmbed, MediaVideo } from './media-nodes-extension.js'

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * @param {string} url
 */
export function isAllowedLinkUrl(url) {
  const trimmed = String(url).trim()
  if (!trimmed) return false
  if (!/^(https?:|mailto:|tel:)/i.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.href : 'https://example.com')
    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * @param {Record<string, unknown>} [features]
 * @param {{ placeholder?: string }} [options]
 */
export function createExtensions(features = {}, options = {}) {
  const starterOptions = {
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https', 'mailto', 'tel'],
      shouldAutoLink: (url) => isAllowedLinkUrl(url),
    },
    ...features,
  }

  /** @type {import('@tiptap/core').Extensions} */
  const extensions = [
    StarterKit.configure(starterOptions),
    Subscript,
    Superscript,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
    }),
    TextStyle,
    FontFamily,
    Color,
    BackgroundColor,
    LetterSpacing,
    LineHeight,
    TextIndent,
    BonsaiImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'bonsai-editor__image',
      },
      resize: {
        enabled: true,
        minWidth: 48,
        minHeight: 48,
        alwaysPreserveAspectRatio: true,
      },
    }),
    TableKit.configure({
      table: { resizable: true },
    }),
    Youtube.configure({
      width: 640,
      height: 360,
      HTMLAttributes: { class: 'bonsai-media-youtube__frame' },
    }),
    MediaEmbed,
    MediaVideo,
    MediaAudio,
  ]

  if (options.placeholder) {
    extensions.push(
      Placeholder.configure({
        placeholder: options.placeholder,
        emptyEditorClass: 'bonsai-editor__placeholder',
      }),
    )
  }

  if (Array.isArray(options.extensions)) {
    extensions.push(...options.extensions)
  }

  return extensions
}
