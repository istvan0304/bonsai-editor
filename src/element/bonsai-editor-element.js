import { BonsaiEditor } from '../core/editor.js'
import { assertOutputFormat, valuesEqual } from '../core/output.js'
import { resolveToolbarFromElement } from './toolbar-attribute.js'
import { resolveMenubarFromElement } from './menubar-attribute.js'

const OBSERVED = [
  'value',
  'output-format',
  'placeholder',
  'readonly',
  'autofocus',
  'toolbar',
  'menubar',
  'aria-label',
  'locale',
  'name',
]

/**
 * @param {string} [tagName]
 */
export function defineBonsaiElement(tagName = 'bonsai-editor') {
  if (typeof HTMLElement === 'undefined') return
  if (customElements.get(tagName)) return

  class BonsaiEditorElement extends HTMLElement {
    static formAssociated = true

    /** @type {ElementInternals | null} */
    #internals = null

    /** @type {BonsaiEditor | null} */
    #editor = null

    /** @type {Record<string, unknown>} */
    features = {}

    /** @type {import('@tiptap/core').Extensions} */
    extensions = []

    /** @type {import('../toolbar/toolbar-config.js').ToolbarOption | null} */
    toolbarConfig = null

    /** @type {import('../menubar/menubar-config.js').MenubarOption | null} */
    menubarConfig = null

    constructor() {
      super()
      if ('attachInternals' in this) {
        this.#internals = this.attachInternals()
      }
    }

    connectedCallback() {
      if (this.#editor) return
      this.classList.add('bonsai-editor-host')

      const outputFormat = this.getAttribute('output-format') ?? 'html'
      assertOutputFormat(outputFormat)

      const content = this.#readInitialValue(outputFormat)

      this.#editor = new BonsaiEditor({
        element: this,
        content,
        outputFormat,
        placeholder: this.getAttribute('placeholder') ?? '',
        ariaLabel: this.getAttribute('aria-label') ?? undefined,
        editable: !this.hasAttribute('readonly'),
        autofocus: this.hasAttribute('autofocus'),
        toolbar: resolveToolbarFromElement(this),
        menubar: resolveMenubarFromElement(this),
        locale: this.getAttribute('locale') ?? undefined,
        features: this.features,
        extensions: this.extensions,
        onUpdate: (value) => {
          this.#syncFormValue(value)
          this.dispatchEvent(
            new CustomEvent('bonsai-update', {
              detail: { value },
              bubbles: true,
              composed: true,
            }),
          )
        },
        onFocus: (event) => {
          this.dispatchEvent(
            new CustomEvent('bonsai-focus', {
              detail: { event },
              bubbles: true,
              composed: true,
            }),
          )
        },
        onBlur: (event) => {
          this.dispatchEvent(
            new CustomEvent('bonsai-blur', {
              detail: { event },
              bubbles: true,
              composed: true,
            }),
          )
        },
      })

      this.#syncFormValue(this.#editor.getValue())

      this.dispatchEvent(
        new CustomEvent('bonsai-ready', {
          detail: { editor: this.#editor },
          bubbles: true,
          composed: true,
        }),
      )
    }

    disconnectedCallback() {
      this.#editor?.destroy()
      this.#editor = null
    }

    formResetCallback() {
      const format = this.getAttribute('output-format') ?? 'html'
      const content = this.#readInitialValue(format)
      this.value = content
    }

    static get observedAttributes() {
      return OBSERVED
    }

    /**
     * @param {string} name
     * @param {string | null} _old
     * @param {string | null} value
     */
    attributeChangedCallback(name, _old, value) {
      if (!this.#editor) return

      if (name === 'readonly') {
        this.#editor.setEditable(!this.hasAttribute('readonly'))
      }
      if (name === 'placeholder' && value !== null) {
        // placeholder requires re-init; update via tiptap extension is complex — skip for v1 runtime change
      }
      if (name === 'output-format' && value) {
        assertOutputFormat(value)
        this.#editor.outputFormat = value
        this.#syncFormValue(this.#editor.getValue())
      }
      if (name === 'locale' && value) {
        this.#editor.setLocale(value)
      }
      if (name === 'name' && this.#internals) {
        // name handled on form submit via current value
      }
    }

    /**
     * @param {string} format
     */
    #readInitialValue(format) {
      const raw = this.getAttribute('value')
      if (raw == null || raw === '') return ''
      if (format === 'json') {
        try {
          return JSON.parse(raw)
        } catch {
          return { type: 'doc', content: [{ type: 'paragraph' }] }
        }
      }
      return raw
    }

    /**
     * @param {string | object} value
     */
    #syncFormValue(value) {
      if (!this.#internals) return
      const format = this.getAttribute('output-format') ?? 'html'
      const formValue = format === 'json' ? JSON.stringify(value) : String(value)
      if (typeof this.#internals.setFormValue === 'function') {
        this.#internals.setFormValue(formValue)
      }
    }

    get editor() {
      return this.#editor
    }

    get value() {
      return this.#editor?.getValue() ?? ''
    }

    /** @param {string | object} next */
    set value(next) {
      if (!this.#editor) return
      const format = this.#editor.outputFormat
      let content = next
      if (format === 'json' && typeof next === 'string') {
        try {
          content = JSON.parse(next)
        } catch {
          return
        }
      }
      const current = this.#editor.getValue()
      if (valuesEqual(current, content)) return
      this.#editor.setContent(content, { emitUpdate: false })
      this.#syncFormValue(this.#editor.getValue())
    }
  }

  customElements.define(tagName, BonsaiEditorElement)
}
