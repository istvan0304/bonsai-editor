# Bonsai Editor

Moduláris, keretrendszer-független rich text szerkesztő [TipTap](https://tiptap.dev) v3 alapokon. A kimenet **HTML** vagy **JSON** formátumban választható.

**English integration guide:** [README.md](../README.md)

## Telepítés

```bash
npm install bonsai-editor
```

Opcionális Vue wrapperhez: `vue` ^3.3 (peer dependency).

## Gyors használat (Vanilla JS)

```js
import { BonsaiEditor } from 'bonsai-editor'
import 'bonsai-editor/style.css'

const editor = new BonsaiEditor({
  element: document.querySelector('#editor'),
  content: '<p>Hello</p>',
  outputFormat: 'html', // vagy 'json'
  toolbar: true,
  placeholder: 'Kezdj el írni…',
  onUpdate: (value) => console.log(value),
})

editor.getHTML()
editor.getJSON()
editor.tiptap.chain().focus().toggleBold().run()
```

## Menüsor (opcionális)

A szerkesztő tetején klasszikus menüsor kapcsolható be: **Fájl**, **Szerkesztés**, **Nézet**, **Formázás**. Alapértelmezés: kikapcsolva (`menubar: false`).

```js
menubar: true

// Csak egyes menük
menubar: ['file', 'edit', 'view']

menubar: { format: false }
```

Menü azonosítók: `file`, `edit`, `view`, `format`.

Web Component: `menubar` attribútum, vagy `menubar-menus="file,edit,view"`.

## Moduláris toolbar

Minden gomb külön be- és kikapcsolható. Azonosítók: `bold`, `italic`, `strike`, `subscript`, `superscript`, `formatPainter`, `heading`, `bulletList`, `orderedList`, `blockquote`, `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`, `sourceCode`, `link`, `undo`, `redo`, `fullscreen`.

**Formátum másoló** (`formatPainter`): jelöld ki a mintát, kattints az ecset ikonra, majd jelöld ki a célszöveget. Dupla kattintás az ikonon: többször is alkalmazható (Esc kilép).

```js
// Csak a felsorolt gombok (whitelist)
toolbar: ['bold', 'italic', 'heading', 'link']

// Alapértelmezett minden gomb, kivételek kikapcsolása
toolbar: {
  sourceCode: false,
  fullscreen: false,
  link: false,
}

// Ugyanaz whitelist-ként
toolbar: {
  items: ['bold', 'bulletList', 'undo', 'redo'],
}
```

Web Component:

```html
<bonsai-editor toolbar toolbar-items="bold,italic,heading,link,fullscreen"></bonsai-editor>
```

Vue:

```vue
<BonsaiVueEditor v-model="html" :toolbar="{ link: false, fullscreen: true }" />
```

## Web Component

```js
import 'bonsai-editor/element'
```

```html
<bonsai-editor
  name="body"
  output-format="json"
  toolbar
  placeholder="Írj ide…"
></bonsai-editor>
<script>
  document.querySelector('bonsai-editor').addEventListener('bonsai-update', (e) => {
    console.log(e.detail.value)
  })
</script>
```

Események: `bonsai-ready`, `bonsai-update`, `bonsai-focus`, `bonsai-blur`.

## Vue 3

```vue
<script setup>
import { ref } from 'vue'
import { BonsaiVueEditor } from 'bonsai-editor/vue'
import 'bonsai-editor/style.css'

const html = ref('<p>Hello Vue!</p>')
const json = ref({ type: 'doc', content: [{ type: 'paragraph' }] })
</script>

<template>
  <BonsaiVueEditor v-model="html" toolbar />
  <BonsaiVueEditor v-model="json" output-format="json" />
</template>
```

## CDN (standalone)

Egy `<script>` tag – a stílusok automatikusan beinjektálódnak:

```html
<div id="editor"></div>
<script src="https://unpkg.com/bonsai-editor"></script>
<script>
  new BonsaiEditor({ element: document.querySelector('#editor'), toolbar: true })
</script>
```

ES modul CDN-ről: `import BonsaiEditor from 'https://unpkg.com/bonsai-editor/dist/bonsai-editor.standalone.js'`

## React (recept)

```jsx
import { useEffect, useRef } from 'react'
import { BonsaiEditor } from 'bonsai-editor'
import 'bonsai-editor/style.css'

export function Editor({ value, outputFormat = 'html', onChange }) {
  const hostRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    editorRef.current = new BonsaiEditor({
      element: hostRef.current,
      content: value,
      outputFormat,
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

## Svelte (recept)

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { BonsaiEditor } from 'bonsai-editor'
  import 'bonsai-editor/style.css'

  export let value = '<p></p>'
  let el
  let editor

  onMount(() => {
    editor = new BonsaiEditor({
      element: el,
      content: value,
      onUpdate: (v) => (value = v),
    })
  })

  onDestroy(() => editor?.destroy())

  $: if (editor && value !== editor.getValue()) {
    editor.setContent(value, { emitUpdate: false })
  }
</script>

<div bind:this={el}></div>
```

## Témázás

A stílusok a `.bonsai-editor` névtér alatt vannak. Felülírható CSS változókkal:

```css
.my-editor.bonsai-editor {
  --bonsai-border-color: #94a3b8;
  --bonsai-focus-color: #059669;
  --bonsai-min-height: 16rem;
}
```

## Biztonság

A kimeneti HTML **nem megbízható** – mentés előtt szerveroldalon szanitizáld (pl. DOMPurify). A link bővítmény alapértelmezetten csak `http`, `https`, `mailto`, `tel` protokollokat enged.

## API (Core)

| Opció / metódus | Leírás |
| --- | --- |
| `outputFormat` | `'html'` \| `'json'` |
| `getValue()` / `getContent(format?)` | Kimenet az aktuális formátumban |
| `getHTML()` / `getJSON()` | Mindig elérhető |
| `setContent(content, { emitUpdate })` | HTML string vagy JSON objektum |
| `on(event, handler)` | `create`, `update`, `focus`, `blur`, `selectionUpdate`, `destroy` |
| `menubar` | `true` / `false` / `{ menu: boolean }` / `['file', …]` – felső menüsor |
| `toolbar` | `true` / `false` / `{ gomb: boolean }` / `['bold', …]` – moduláris eszköztár |
| `fileManager` | `uploadUrl`, `listUrl`, `deleteUrl`, opcionális `userId`, `initialPath` / `startFolder` (megnyitáskor kezdő mappa, alap: gyökér), egyedi handler – szerveres feltöltés (toolbar `fileManager` gomb) |
| `features` | StarterKit finomhangolás |

Példa szerveres feltöltésre:

```js
new BonsaiEditor({
  element: document.querySelector('#editor'),
  toolbar: true,
  fileManager: {
    userId: currentUser.id, // minden kérésben ?userId=… + X-Bonsai-User-Id fejléc
    initialPath: 'dokumentumok', // megnyitáskor /dokumentumok (nested: 'képek/2024')
    uploadUrl: '/api/uploads', // POST multipart (?path=mappa) mező: file
    listUrl: '/api/uploads', // GET → browse fallback
    deleteUrl: '/api/uploads', // DELETE /api/uploads/entry?path=...
  },
})
```

A backendnek a `userId` alapján kell szűkítenie a listát/feltöltést/törlést (a demó plugin a `.demo-uploads/_users/{userId}/` mappában tárol). A `userId` önmagában nem titkosítás – éles környezetben session/JWT alapú azonosítást használj, és ne bízz a kliens által küldött azonosítóban ellenőrzés nélkül.

A `npm run demo` dev szerver mappás API-t ad: `GET /api/uploads/browse?path=&userId=`, `POST /api/uploads/folders`, fájlok: `.demo-uploads/` (felhasználónként: `_users/{userId}/`). A demóban `?user=alice` vagy `?user=bob` query paraméterrel kipróbálható a szétválasztás.

## Demó

```bash
npm run demo          # Vite dev szerver – a demó oldal automatikusan frissül (HMR)
npm run demo:static   # buildelt standalone bundle statikus kiszolgálása
```

## Fejlesztés

```bash
npm run dev           # egyszerű playground (playground/)
npm test
npm run build
npm run verify   # npm pack + export ellenőrzés
npm run ci       # lint + test + build + verify
```

Részletes specifikáció: [SPECIFIKACIO.md](../SPECIFIKACIO.md).
