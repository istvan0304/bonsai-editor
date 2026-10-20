# Using Bonsai Editor in your project

Bonsai Editor is a modular, framework-agnostic rich text editor built on [TipTap](https://tiptap.dev) v3. You can embed it with plain JavaScript, a Web Component, or wrappers (Vue 3 is included in the package). Output can be **HTML** or **TipTap JSON**.

## Install

```bash
npm install bonsai-editor
```

Optional peer dependency for the Vue wrapper: `vue` ^3.3.

Always load the stylesheet once in your app:

```js
import 'bonsai-editor/style.css'
```

If you use the standalone IIFE bundle from a CDN, styles are injected automatically.

## Minimal setup (Vanilla JS)

1. Add a host element in your HTML:

```html
<div id="editor"></div>
```

2. Create the editor when the DOM is ready:

```js
import { BonsaiEditor } from 'bonsai-editor'
import 'bonsai-editor/style.css'

const editor = new BonsaiEditor({
  element: document.querySelector('#editor'),
  content: '<p>Hello</p>',
  outputFormat: 'html', // or 'json'
  toolbar: true,
  placeholder: 'Start typing…',
  onUpdate: (value) => {
    // value is HTML string or JSON object, depending on outputFormat
    console.log(value)
  },
})
```

3. Read or set content:

```js
editor.getValue()           // current format (html or json)
editor.getHTML()            // always HTML string
editor.getJSON()            // always TipTap document object
editor.setContent('<p>Updated</p>', { emitUpdate: false })
```

4. Clean up when the host is removed (SPA route change, modal close, etc.):

```js
editor.destroy()
```

## TypeScript

Types ship with the package:

```ts
import { BonsaiEditor } from 'bonsai-editor'
import type { OutputFormat } from 'bonsai-editor'
```

Use `BonsaiEditor` options as documented below; `getJSON()` returns a TipTap-compatible JSON document.

## UI: toolbar and menubar

**Toolbar** — icon buttons for formatting, undo, source view, file manager, etc.

```js
toolbar: true // default set of buttons

// Whitelist only these controls
toolbar: ['bold', 'italic', 'heading', 'link', 'undo', 'redo']

// Default set, but disable some
toolbar: {
  sourceCode: false,
  fullscreen: false,
}
```

Common toolbar item ids include: `bold`, `italic`, `underline`, `strike`, `subscript`, `superscript`, `formatPainter`, `heading`, `fontFamily`, `letterSpacing`, `lineHeight`, `textColor`, `textBackground`, `bulletList`, `orderedList`, `blockquote`, `indentIncrease`, `indentDecrease`, align buttons, `link`, `insertMedia`, `insertTable`, `sourceCode`, `exportPdf`, `importWord`, `fileManager`, `undo`, `redo`, `fullscreen`, `copyContent`, `clearContent`.

**Menubar** — classic menu bar (File, Edit, View, Format). Off by default.

```js
menubar: true
menubar: ['file', 'edit', 'view']
menubar: { format: false }
```

Menu ids: `file`, `edit`, `view`, `format`.

## Internationalization (locale)

Built-in UI strings: **Hungarian** (default), **English**, **German**, **Spanish**, **Italian**.

```js
const editor = new BonsaiEditor({
  element: el,
  locale: 'en',
})

editor.setLocale('de')
editor.on('localeChange', (locale) => console.log(locale))
```

Web Component:

```html
<bonsai-editor locale="en" toolbar></bonsai-editor>
```

Programmatic helpers (also exported from the main entry):

```js
import { SUPPORTED_LOCALES, resolveLocale, createTranslator } from 'bonsai-editor'
```

## Web Component

Register the custom element once:

```js
import 'bonsai-editor/element'
import 'bonsai-editor/style.css'
```

```html
<bonsai-editor
  name="body"
  output-format="html"
  locale="en"
  toolbar
  menubar
  placeholder="Write here…"
></bonsai-editor>
```

Listen for changes:

```js
const el = document.querySelector('bonsai-editor')

el.addEventListener('bonsai-ready', (e) => {
  const editor = e.detail.editor // BonsaiEditor instance
})

el.addEventListener('bonsai-update', (e) => {
  console.log(e.detail.value)
})
```

Events: `bonsai-ready`, `bonsai-update`, `bonsai-focus`, `bonsai-blur`.

Attributes: `value`, `output-format`, `placeholder`, `readonly`, `autofocus`, `toolbar`, `toolbar-items`, `menubar`, `menubar-menus`, `locale`, `aria-label`, `name`.

The element supports [form-associated custom elements](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) when the browser allows it.

## Vue 3

```vue
<script setup>
import { ref } from 'vue'
import { BonsaiVueEditor } from 'bonsai-editor/vue'
import 'bonsai-editor/style.css'

const html = ref('<p>Hello</p>')
</script>

<template>
  <BonsaiVueEditor v-model="html" toolbar locale="en" />
</template>
```

Use `output-format="json"` and bind a JSON document when you need structured content.

## React (pattern)

Mount once, sync `value` from props, destroy on unmount:

```jsx
import { useEffect, useRef } from 'react'
import { BonsaiEditor } from 'bonsai-editor'
import 'bonsai-editor/style.css'

export function RichTextEditor({ value, outputFormat = 'html', onChange }) {
  const hostRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    editorRef.current = new BonsaiEditor({
      element: hostRef.current,
      content: value,
      outputFormat,
      toolbar: true,
      onUpdate: onChange,
    })
    return () => editorRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!editorRef.current || value === editorRef.current.getValue()) return
    editorRef.current.setContent(value, { emitUpdate: false })
  }, [value])

  return <div ref={hostRef} />
}
```

## CDN / no bundler

IIFE (global `BonsaiEditor`):

```html
<div id="editor"></div>
<script src="https://unpkg.com/bonsai-editor"></script>
<script>
  new BonsaiEditor({ element: document.querySelector('#editor'), toolbar: true })
</script>
```

ES module:

```js
import BonsaiEditor from 'https://unpkg.com/bonsai-editor/dist/bonsai-editor.standalone.js'
```

## File manager (optional)

Enable server-side upload/browse when you pass `fileManager` and include the `fileManager` toolbar button (or use the File menu).

```js
new BonsaiEditor({
  element: document.querySelector('#editor'),
  toolbar: true,
  fileManager: {
    userId: currentUser.id,
    initialPath: 'documents',
    uploadUrl: '/api/uploads',
    listUrl: '/api/uploads',
    deleteUrl: '/api/uploads',
    maxFileSize: 15 * 1024 * 1024,
  },
})
```

Your API must scope files by authenticated user. The client sends `userId` as a query parameter and `X-Bonsai-User-Id` header — treat these as hints only; enforce access on the server with sessions or JWT.

Without URLs, the file manager still works in **local browse mode** (no persistent server storage).

## Import / export helpers

From the editor instance or toolbar actions:

```js
await editor.exportPdf({ fileName: 'document.pdf' })
// Uses the browser print dialog → “Save as PDF”

await editor.importWordFromPicker({ replaceContent: true })
// .docx only; confirms before replacing document content
```

Programmatic media insert:

```js
editor.insertMediaFromUrl('https://example.com/image.png', { title: 'Optional caption' })
```

## Extending TipTap

Pass extra TipTap extensions or tune StarterKit via `features`:

```js
new BonsaiEditor({
  element: el,
  extensions: [/* your TipTap extensions */],
  features: {
    /* StarterKit-related flags */
  },
})
```

Access the underlying editor for advanced commands:

```js
editor.tiptap.chain().focus().toggleBold().run()
```

## Events

```js
editor.on('update', (value) => {})
editor.on('focus', (event) => {})
editor.on('blur', (event) => {})
editor.on('selectionUpdate', () => {})
editor.on('destroy', () => {})
editor.on('localeChange', (locale) => {})
editor.on('sourceViewChange', (active) => {})
```

## Theming

Styles live under the `.bonsai-editor` namespace. Override CSS variables on the host:

```css
#editor.bonsai-editor {
  --bonsai-border-color: #94a3b8;
  --bonsai-focus-color: #059669;
  --bonsai-min-height: 16rem;
}
```

For Web Component hosts, use the class `bonsai-editor-host` on the element and target `.bonsai-editor` inside it.

## Security

Editor output HTML is **not trusted**. Sanitize on the server before storing or rendering (e.g. DOMPurify). Links are restricted by default to `http`, `https`, `mailto`, and `tel`.

## Package exports

| Import | Purpose |
| --- | --- |
| `bonsai-editor` | `BonsaiEditor`, utilities, i18n |
| `bonsai-editor/style.css` | Required styles |
| `bonsai-editor/element` | Registers `<bonsai-editor>` |
| `bonsai-editor/vue` | `BonsaiVueEditor` component |
| `bonsai-editor/standalone` | Single-file ESM for CDN |

## Local demo

Clone the repo and run:

```bash
npm install
npm run demo
```

Open the dev server URL; try `?lang=en` for English UI. Use `npm run demo:static` for a production-like static demo.

## Troubleshooting

- **Blank editor** — Check that the host element exists and has size; import `bonsai-editor/style.css`.
- **Double initialization** — Call `destroy()` before creating a new instance on the same node.
- **Vite / bundlers** — Use the documented imports; Word import uses a browser build of Mammoth resolved by the package.
- **Form submit** — With the Web Component, set the `name` attribute; value follows `output-format`.

For API details and Hungarian documentation, see [docs/USAGE.md](./docs/USAGE.md).
