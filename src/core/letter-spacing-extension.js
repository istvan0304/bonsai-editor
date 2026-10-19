import { Extension, getStyleProperty, isValidCSSStyleValue } from '@tiptap/core'

/**
 * Betűköz (letter-spacing) a textStyle markon.
 * @see https://www.tiptap.dev/api/extensions/text-style
 */
export const LetterSpacing = Extension.create({
  name: 'letterSpacing',

  addOptions() {
    return { types: ['textStyle'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) => {
              const value =
                getStyleProperty(element, 'letter-spacing') ?? element.style.letterSpacing
              if (!value || value === 'normal') return null
              return value
            },
            renderHTML: (attributes) => {
              if (!isValidCSSStyleValue(attributes.letterSpacing)) return {}
              return { style: `letter-spacing: ${attributes.letterSpacing}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLetterSpacing:
        (letterSpacing) =>
        ({ chain }) =>
          chain().setMark('textStyle', { letterSpacing }).run(),
      unsetLetterSpacing:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { letterSpacing: null }).removeEmptyTextStyle().run(),
    }
  },
})
