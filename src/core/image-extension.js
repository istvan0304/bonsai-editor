import Image from '@tiptap/extension-image'

/** @typedef {'left' | 'center' | 'right'} ImageAlignValue */

export const BonsaiImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left',
        parseHTML: (element) => {
          const value = element.getAttribute('data-align')
          if (value === 'center' || value === 'right') return value
          return 'left'
        },
        renderHTML: (attributes) => {
          const align = attributes.align
          if (!align || align === 'left') return {}
          return { 'data-align': align }
        },
      },
    }
  },
})
