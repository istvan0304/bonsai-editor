# Műszaki Specifikáció: Bonsai Editor (NPM Package)

**Projekt neve:** Bonsai Editor
**NPM csomagnév:** `bonsai-editor`
**Verzió (specifikáció):** 0.3

---

## 1. Projekt Áttekintés és Célkitűzések

**Cél:** Egy moduláris, testreszabható, könnyű súlyú rich text szerkesztő létrehozása, amely NPM csomagként telepíthető, és **bármilyen webes alkalmazásban egyszerűen használható, akkor is, ha az alkalmazás nem használ Vue-t (vagy bármilyen más keretrendszert).**

**Architektúra:** Headless mag (Core) Vanilla ES6-ban, amely független a keretrendszerektől. A Core a TipTap parancs-API-ját is elérhetővé teszi, így bármilyen UI (saját toolbar, wrapper) építhető rá.

**Motor:** TipTap (ProseMirror alapokon) a stabil szövegkezelésért és bővíthetőségért.

### 1.1 Alapelvek

1. **Keretrendszer-függetlenség:** a Core és a Web Component nem importál és nem igényel Vue-t. A Vue csak a `bonsai-editor/vue` entry-hez kell.
2. **Egyszerű használat:** a csomag három módon használható, mindegyik működik build eszköz és keretrendszer nélkül is (lásd 7. fejezet):
   - **CDN / `<script>` tag:** egyetlen JS fájl, a stílusokat automatikusan beinjektálja.
   - **ES modul (npm + bundler):** `import { BonsaiEditor } from 'bonsai-editor'`.
   - **Web Component:** `<bonsai-editor>` HTML elem, amely bármilyen keretrendszerben vagy sima HTML-ben működik.
3. **Választható kimeneti formátum:** a szerkesztő tartalma **HTML vagy JSON** formában is lekérhető, és ez egyetlen `outputFormat` opcióval állítható (lásd 4.4).
4. **Opcionális minden, ami nem mag:** a Vue wrapper, a toolbar és a Web Component külön importálható, a Core ezektől független.

### 1.2 Scope (v1)

- Core `BonsaiEditor` osztály (HTML/JSON be- és kimenet, események, életciklus-kezelés)
- `<bonsai-editor>` Web Component (form-integrációval)
- Önálló (standalone) CDN build: IIFE és ES modul, TipTap-pal együtt csomagolva
- Alapértelmezett stílus (CSS változókkal témázható)
- Opcionális, minimális vanilla toolbar
- Opcionális Vue 3 wrapper `v-model` támogatással
- ESM + CJS csomag npm-hez
- TypeScript típusdefiníciók (`.d.ts`)

### 1.3 Non-goals (v1)

- Hivatalos React / Svelte / Angular wrapper (a Core és a Web Component ezekben is használható, a README integrációs példákat ad)
- Kollaboratív szerkesztés, kommentelés, Markdown import/export
- Képfeltöltés kezelése (a kép node opcionális bővítményként érhető el, a feltöltés a host alkalmazás feladata)
- Szerveroldali HTML szanitizálás (lásd 10. fejezet)

---

## 2. Technológiai Stack

| Terület | Választás |
| --- | --- |
| Nyelv | Modern JavaScript (ES2020+ / ECMAScript Modules), JSDoc típusannotációkkal |
| Típusok | `.d.ts` generálás JSDoc-ból (`tsc --emitDeclarationOnly` vagy `vite-plugin-dts`) |
| Szerkesztő motor | `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/pm` (**TipTap v3**, a főverzió rögzített) |
| Build eszköz | Vite (Library Mode), két build konfiguráció: npm csomag és önálló CDN build (lásd 5. fejezet) |
| Stílusozás | Tiszta CSS + CSS custom properties. Tailwind nem használt (külső függőség elkerülése) |
| Tesztelés | Vitest + jsdom |
| Minőségbiztosítás | ESLint, Prettier |
| Böngészőtámogatás | Modern evergreen böngészők, `build.target: 'es2020'` |

**Függőségkezelés:**

- `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/pm`: `dependencies` (vagy `peerDependencies`), pontosan azonos TipTap főverzióval. A cél, hogy ne kerüljön két ProseMirror példány a felhasználó bundle-jébe.
- `vue`: **optional** `peerDependency` (csak a Vue wrapperhez kell). Aki nem használja a `bonsai-editor/vue` entry-t, annak a Vue-t nem kell telepítenie, és nem is kerül a bundle-jébe.

---

## 3. Csomag Architektúra és Fájlstruktúra

A csomag rétegei: Core Engine (Vanilla JS), Web Component, opcionális Toolbar és opcionális Vue 3 wrapper. Mindegyik **külön entry pont**, így a felhasználó csak azt húzza be, amire szüksége van.

```text
bonsai-editor/
├── src/
│   ├── core/
│   │   ├── editor.js              # BonsaiEditor osztály (TipTap wrapper)
│   │   ├── extensions.js          # Alap és egyedi bővítmények konfigurációja
│   │   ├── output.js              # Kimeneti formátum kezelése (html/json)
│   │   └── theme.css              # Alapértelmezett CSS stílusok
│   ├── toolbar/
│   │   └── toolbar.js             # Opcionális vanilla toolbar
│   ├── element/
│   │   └── bonsai-editor-element.js  # <bonsai-editor> Web Component
│   ├── wrappers/
│   │   └── vue/
│   │       ├── BonsaiVueEditor.js # Vue 3 komponens (defineComponent + h, nem kell SFC plugin)
│   │       └── index.js           # Vue entry pont
│   ├── index.js                   # Core entry (Core + Toolbar, Vue-t és Web Componentet NEM regisztrál)
│   ├── element.js                 # Web Component entry (importáláskor regisztrálja az elemet)
│   └── standalone.js              # CDN entry (Core + Web Component + automatikus stílusinjektálás)
├── tests/                         # Vitest tesztek
├── playground/                    # Dev oldalak kézi teszteléshez
│   ├── index.html                 # Bundleres (ES modul) példa
│   └── plain.html                 # Build eszköz nélküli példa: egyetlen <script> tag
├── dist/                          # Build kimenet (nem verziókövetett)
├── package.json
├── vite.config.js                 # npm build (ES + CJS)
├── vite.config.standalone.js      # CDN build (IIFE + ES, TipTap-pal együtt)
├── .gitignore
├── LICENSE
├── CHANGELOG.md
└── README.md
```

---

## 4. Core Motor Specifikáció (`src/core/editor.js`)

A Core osztály felel a TipTap példányosításáért, a DOM elemhez való kötődésért és az események kezeléséért. **Importáláskor nem fér hozzá a `document`/`window` objektumokhoz** (SSR-biztos), a DOM-ot csak a konstruktorban használja.

### 4.1 Konstruktor opciók

```js
new BonsaiEditor({
  element,            // HTMLElement (kötelező)
  content,            // string (HTML) | object (JSON), alapértelmezett: ''
  outputFormat,       // 'html' | 'json', a kimenet formátuma, alapértelmezett: 'html' (lásd 4.4)
  editable,           // boolean, alapértelmezett: true
  autofocus,          // boolean | 'start' | 'end', alapértelmezett: false
  placeholder,        // string, alapértelmezett: ''
  ariaLabel,          // string, a szerkeszthető terület aria-label értéke
  toolbar,            // boolean, alapértelmezett: false (az alapértelmezett toolbar megjelenítése)
  injectStyles,       // boolean, a theme.css automatikus beinjektálása (a standalone build alapértelmezetten true, az npm build false)
  features,           // objektum, a StarterKit funkcióinak ki/bekapcsolása, pl. { heading: { levels: [2, 3] }, codeBlock: false }
  extensions,         // további TipTap bővítmények tömbje
  onCreate,           // (editor) => void
  onUpdate,           // (value, editor) => void, a value az outputFormat szerinti formátumú
  onFocus,            // (event, editor) => void
  onBlur,             // (event, editor) => void
  onSelectionUpdate,  // (editor) => void
  onDestroy,          // () => void
})
```

### 4.2 Metódusok és tulajdonságok

| Metódus | Leírás |
| --- | --- |
| `getValue()` | Visszaadja a tartalmat az `outputFormat` szerinti formátumban (HTML string vagy JSON objektum). |
| `getContent(format?)` | Visszaadja a tartalmat a megadott formátumban (`'html'` vagy `'json'`). Ha nincs megadva, az `outputFormat` az alapértelmezett. |
| `getHTML()` | Mindig HTML stringet ad vissza, az `outputFormat`-tól függetlenül (`editor.getHTML()`). |
| `getJSON()` | Mindig JSON objektumot ad vissza, az `outputFormat`-tól függetlenül (`editor.getJSON()`). |
| `getText()` | Visszaadja a tartalmat egyszerű szövegként. |
| `isEmpty()` | `true`, ha a dokumentum üres. |
| `setContent(content, { emitUpdate = false })` | Beállítja a tartalmat. A `content` lehet HTML string vagy JSON objektum (a típusból felismerhető), és független az `outputFormat`-tól. Alapértelmezetten **nem** hív `onUpdate`-et, így a `v-model` nem kerül végtelen ciklusba. |
| `outputFormat` (getter/setter) | A kimeneti formátum lekérdezése és futásidejű módosítása (`'html'` vagy `'json'`). Érvénytelen értékre hibát dob. |
| `setEditable(editable)` | Szerkeszthetőség váltása futásidőben. |
| `focus(position?)` / `blur()` | Fókusz kezelése. |
| `on(event, handler)` / `off(event, handler)` | Feliratkozás eseményekre (`create`, `update`, `focus`, `blur`, `selectionUpdate`, `destroy`). Az `update` esemény payloadja az `outputFormat` szerinti érték. |
| `tiptap` (getter) | A mögöttes TipTap `Editor` példány. Ezen keresztül érhetők el a parancsok (`editor.tiptap.chain().focus().toggleBold().run()`). |
| `isDestroyed` (getter) | `true`, ha az editor már megsemmisült. |
| `destroy()` | Meghívja a TipTap `destroy()`-át (leköti az eseményfigyelőket, felszabadítja a DOM-ot), lefuttatja az `onDestroy` callbacket. **Idempotens**: többszöri hívás nem dob hibát. |

### 4.3 Alapértelmezett funkciók

Az `extensions.js` a StarterKitet konfigurálja, és a `features` opcióval szűkíthető. A v1 alapértelmezett funkciói: bekezdés, címsorok (H1–H3), félkövér, dőlt, áthúzott, felsorolás, számozott lista, idézet, kódblokk, inline kód, vízszintes vonal, undo/redo. A link csak engedélyezett protokollokkal működik (lásd 10. fejezet). Placeholder és kép csak opcionális bővítményként érhető el.

### 4.4 Kimeneti formátum (HTML vagy JSON)

Az `outputFormat` opció dönti el, hogy a szerkesztő **milyen formában adja ki** a tartalmat. A bemenet (`content`, `setContent`) formátuma ettől független: HTML string és JSON objektum is mindig elfogadott.

| `outputFormat` | Érték típusa | Példa |
| --- | --- | --- |
| `'html'` (alapértelmezett) | `string` | `'<p>Hello</p>'` |
| `'json'` | `object` (TipTap/ProseMirror dokumentum) | `{ "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hello" }] }] }` |

Az `outputFormat` az alábbi helyeken érvényesül, így a két formátum között egyetlen beállítással lehet váltani:

- `getValue()` visszatérési értéke
- `onUpdate` callback és az `update` esemény payloadja
- Vue wrapper: a `v-model` típusa (string vagy objektum)
- Web Component: a `value` property és a `bonsai-update` esemény `detail.value` mezője
- Form integráció: HTML esetén a string, JSON esetén a `JSON.stringify` eredménye kerül beküldésre

Szabályok:

- A formátumtól függetlenül mindig elérhető a `getHTML()` és a `getJSON()` is.
- A JSON kimenet mindig új, független objektum (módosítása nem hat a szerkesztőre).
- Üres dokumentum: HTML-ben `'<p></p>'`, JSON-ben `{ "type": "doc", "content": [{ "type": "paragraph" }] }`. Az `isEmpty()` segít az ellenőrzésben.
- A `content` típusa dönti el a bemenet formátumát: `string` → HTML, `object` → JSON. JSON stringet a Core nem parse-ol automatikusan (a Web Component attribútum kivétel, lásd 8. fejezet).
- Érvénytelen `outputFormat` érték a konstruktorban hibát dob.

---

## 5. Build Konfiguráció

A csomag két külön buildben készül, mert a két cél ellentétes:

- **npm build:** a TipTap és a Vue **külső** függőség (a felhasználó bundlere kezeli, nincs duplikáció). Több entry, ES + CJS formátum. A Vite Library Mode több entry mellett nem támogat IIFE/UMD formátumot.
- **Standalone (CDN) build:** egyetlen fájl, amely a TipTap-ot is tartalmazza, így build eszköz nélkül, egy `<script>` taggel használható. A Vue nem része.

### 5.1 `vite.config.js` (npm: ES + CJS, több entry)

```js
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      entry: {
        'bonsai-editor': resolve(__dirname, 'src/index.js'),
        element: resolve(__dirname, 'src/element.js'),
        vue: resolve(__dirname, 'src/wrappers/vue/index.js'),
      },
      formats: ['es', 'cjs'],
      cssFileName: 'bonsai-editor', // kimenet: dist/bonsai-editor.css (Vite 6+)
    },
    rollupOptions: {
      external: [/^@tiptap\//, 'vue'],
    },
  },
})
```

### 5.2 `vite.config.standalone.js` (CDN: önálló bundle)

```js
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    target: 'es2020',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/standalone.js'),
      name: 'BonsaiEditor', // globális változó: window.BonsaiEditor
      formats: ['iife', 'es'],
      fileName: (format) =>
        format === 'iife' ? 'bonsai-editor.standalone.iife.js' : 'bonsai-editor.standalone.js',
    },
  },
})
```

A `src/standalone.js`:

- csak **default exportja** van (a `BonsaiEditor` osztály), így az IIFE build globálisan közvetlenül az osztályt adja: `new BonsaiEditor({ ... })`, nem kell `BonsaiEditor.BonsaiEditor`;
- regisztrálja a `<bonsai-editor>` elemet;
- a `theme.css` tartalmát (`?inline` import) egyszer, `<style id="bonsai-editor-styles">` elemként beinjektálja az első példányosításkor (kikapcsolható: `injectStyles: false`). Így a CDN használathoz egyetlen `<script>` tag elég, külön CSS fájl nem kell.

### 5.3 `package.json` (releváns mezők)

```json
{
  "name": "bonsai-editor",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "main": "./dist/bonsai-editor.cjs",
  "module": "./dist/bonsai-editor.js",
  "types": "./dist/index.d.ts",
  "unpkg": "./dist/bonsai-editor.standalone.iife.js",
  "jsdelivr": "./dist/bonsai-editor.standalone.iife.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/bonsai-editor.js",
      "require": "./dist/bonsai-editor.cjs"
    },
    "./element": {
      "types": "./dist/element.d.ts",
      "import": "./dist/element.js",
      "require": "./dist/element.cjs"
    },
    "./vue": {
      "types": "./dist/vue.d.ts",
      "import": "./dist/vue.js",
      "require": "./dist/vue.cjs"
    },
    "./standalone": "./dist/bonsai-editor.standalone.js",
    "./style.css": "./dist/bonsai-editor.css"
  },
  "sideEffects": ["*.css", "./dist/element.*"],
  "files": ["dist"],
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "peerDependenciesMeta": {
    "vue": { "optional": true }
  },
  "scripts": {
    "dev": "vite playground",
    "build": "vite build && vite build --config vite.config.standalone.js",
    "test": "vitest run",
    "lint": "eslint src tests"
  }
}
```

Az `unpkg` és `jsdelivr` mezők miatt a CDN-es URL-ben (`https://unpkg.com/bonsai-editor`) elég a csomagnevet megadni.

---

## 6. Stílusok és témázás (`src/core/theme.css`)

- Minden szelektor a `.bonsai-editor` osztály alatt él (névtér), hogy ne ütközzön a host oldal stílusaival.
- A témázás CSS custom property-kkel történik, például:
  `--bonsai-border-color`, `--bonsai-border-radius`, `--bonsai-focus-color`, `--bonsai-bg`, `--bonsai-text-color`, `--bonsai-font-family`, `--bonsai-min-height`, `--bonsai-padding`.
- Lefedett állapotok: alap tipográfia (címsorok, listák, idézet, kód), szerkesztő doboz kerete, fókusz (`:focus-within`), letiltott/read-only állapot, placeholder.
- Npm használat esetén a stílus a `bonsai-editor/style.css` útvonalon importálható. A JS entry **nem** importálja automatikusan, így a felhasználó dönthet a betöltésről.
- A standalone build a stílust automatikusan beinjektálja (lásd 5.2).
- A Web Component light DOM-ot használ (nem Shadow DOM-ot), így a CSS változók és a globális stílusok egyszerűen felülírhatók.

---

## 7. Használati Minták (API Design)

### A) CDN / sima HTML (build eszköz és keretrendszer nélkül)

Egyetlen `<script>` tag elég, külön CSS betöltés nem kell:

```html
<div id="editor"></div>

<script src="https://unpkg.com/bonsai-editor"></script>
<script>
  const editor = new BonsaiEditor({
    element: document.querySelector('#editor'),
    content: '<p>Kezdeti szöveg...</p>',
    outputFormat: 'html', // vagy 'json'
    toolbar: true,
    onUpdate: (value) => console.log('Tartalom változott:', value),
  })
</script>
```

ES modulként, szintén build nélkül:

```html
<script type="module">
  import BonsaiEditor from 'https://unpkg.com/bonsai-editor/dist/bonsai-editor.standalone.js'

  new BonsaiEditor({ element: document.querySelector('#editor') })
</script>
```

### B) ES modul (npm + bundler, bármilyen keretrendszer)

```js
import { BonsaiEditor } from 'bonsai-editor'
import 'bonsai-editor/style.css'

const editor = new BonsaiEditor({
  element: document.querySelector('#editor-container'),
  content: '<p>Kezdeti szöveg...</p>',
  placeholder: 'Kezdj el írni...',
  outputFormat: 'json',
  onUpdate: (doc) => {
    console.log('Tartalom változott (JSON):', doc)
  },
})

// HTML és JSON mindig lekérhető, a kimeneti formátumtól függetlenül:
editor.getHTML()
editor.getJSON()

// Parancsok a TipTap példányon keresztül:
editor.tiptap.chain().focus().toggleBold().run()
```

### C) Web Component (lásd 8. fejezet)

```html
<script src="https://unpkg.com/bonsai-editor"></script>

<bonsai-editor id="ed" output-format="json" placeholder="Kezdj el írni..." toolbar></bonsai-editor>

<script>
  const el = document.querySelector('#ed')
  el.addEventListener('bonsai-update', (e) => console.log(e.detail.value))
</script>
```

### D) Vue 3 (opcionális wrapper)

```vue
<script setup>
import { ref } from 'vue'
import { BonsaiVueEditor } from 'bonsai-editor/vue'
import 'bonsai-editor/style.css'

const html = ref('<p>Hello Vue!</p>')
const json = ref({ type: 'doc', content: [{ type: 'paragraph' }] })
</script>

<template>
  <!-- HTML kimenet: a v-model string -->
  <BonsaiVueEditor v-model="html" placeholder="Kezdj el írni..." />

  <!-- JSON kimenet: a v-model objektum -->
  <BonsaiVueEditor v-model="json" output-format="json" />
</template>
```

### E) Más keretrendszerek (példa: React)

Hivatalos React wrapper nincs, de a Core egyszerűen használható (a README ilyen recepteket tartalmaz React, Svelte és Angular esetére is):

```jsx
import { useEffect, useRef } from 'react'
import { BonsaiEditor } from 'bonsai-editor'
import 'bonsai-editor/style.css'

export function Editor({ value, onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    const editor = new BonsaiEditor({ element: ref.current, content: value, onUpdate: onChange })
    return () => editor.destroy()
  }, [])

  return <div ref={ref} />
}
```

### Vue wrapper követelmények

- **Props:** `modelValue`, `outputFormat` (`'html'` | `'json'`), `editable`, `placeholder`, `toolbar`, `features`, `extensions`.
- **Emitek:** `update:modelValue`, `focus`, `blur`, `ready`.
- A `modelValue` típusa az `outputFormat`-tól függ: `string` (HTML) vagy `object` (JSON). A bemeneti érték bármelyik formátumú lehet.
- A `modelValue` változásakor a `setContent` csak akkor fut, ha az érték eltér a szerkesztő aktuális tartalmától (HTML esetén string-, JSON esetén mélységi összehasonlítás), különben a kurzor ugrálna.
- Az editor példány az `onMounted`-ben jön létre (SSR/Nuxt-kompatibilis), és az `onBeforeUnmount`-ban `destroy()` hívódik.
- `defineExpose({ editor })`: a szülő komponens hozzáfér a `BonsaiEditor` példányhoz.
- A komponens `defineComponent` + `h()` segítségével készül `.js` fájlban, így a build nem igényel `@vitejs/plugin-vue`-t.

---

## 8. Web Component (`<bonsai-editor>`)

A Web Component teszi lehetővé, hogy a szerkesztő deklaratívan, JavaScript osztály példányosítása nélkül, bármilyen keretrendszerben (vagy keretrendszer nélkül) használható legyen.

**Regisztráció:**

- `import 'bonsai-editor/element'` regisztrálja a `<bonsai-editor>` elemet (az importálás mellékhatása).
- A standalone (CDN) build automatikusan regisztrálja.
- Egyedi tagnév: az `element` entry exportálja a `defineBonsaiElement(tagName = 'bonsai-editor')` függvényt.
- SSR-biztos: az osztály csak akkor definiálódik, ha a `HTMLElement` létezik.

**Attribútumok:**

| Attribútum | Leírás |
| --- | --- |
| `value` | Kezdeti tartalom. `output-format="json"` esetén JSON stringként parse-olódik, egyébként HTML. |
| `output-format` | `html` (alapértelmezett) vagy `json`. |
| `placeholder` | Placeholder szöveg. |
| `readonly` | Nem szerkeszthető állapot. |
| `autofocus` | Automatikus fókusz. |
| `toolbar` | Az alapértelmezett toolbar megjelenítése. |
| `aria-label` | A szerkeszthető terület címkéje. |
| `name` | Űrlapmező neve (form integráció). |

**Property-k és metódusok:**

- `value` (getter/setter): az `output-format` szerinti érték (HTML string vagy JSON objektum). A setter JSON módban objektumot és JSON stringet is elfogad.
- `editor` (getter): a mögöttes `BonsaiEditor` példány (a `bonsai-ready` esemény után érhető el).
- `features`, `extensions`: csak property-ként állítható (nem attribútum).

**Események** (mind buborékol, a payload a `detail`-ben van):

| Esemény | `detail` |
| --- | --- |
| `bonsai-ready` | `{ editor }` |
| `bonsai-update` | `{ value }` (az `output-format` szerinti formátumban) |
| `bonsai-focus` | `{ event }` |
| `bonsai-blur` | `{ event }` |

**Működés:**

- **Light DOM:** az elem nem használ Shadow DOM-ot, így a témázás CSS változókkal és globális stílusokkal egyszerű.
- **Életciklus:** a `connectedCallback` hozza létre az editort, a `disconnectedCallback` hívja a `destroy()`-t. Újracsatolás esetén az utolsó tartalommal újra létrejön.
- **Form integráció:** az elem form-associated custom element (`ElementInternals`). A `name` attribútum esetén az űrlap beküldésekor HTML kimenetnél a HTML string, JSON kimenetnél a `JSON.stringify` eredménye kerül a mezőbe. Támogatott a `form.reset()` is.
- **Attribútum-változás:** a `readonly`, `placeholder` és `output-format` változása futásidőben is érvényesül (`attributeChangedCallback`).

---

## 9. Opcionális Toolbar (`src/toolbar/toolbar.js`)

- Vanilla JS modul, amely egy `BonsaiEditor` példányhoz gombsort (félkövér, dőlt, címsor, lista, idézet, link, undo/redo) renderel.
- Bekapcsolása: `toolbar: true` opció, `toolbar` attribútum (Web Component) vagy `toolbar` prop (Vue). Önállóan is használható: `new BonsaiToolbar(editor, { element })`.
- A gombok állapota (`active`/`disabled`) a `selectionUpdate` eseményre frissül.
- A toolbar tree-shakeable (named export a fő entry-ből), a Core ettől független. Ha nincs bekapcsolva, nem kerül a kódba, amit a bundler el tud hagyni.

---

## 10. Biztonság és Elérhetőség

**Biztonság**

- A TipTap séma csak az ismert node/mark típusokat engedi át, de a kimeneti HTML-t **nem** tekintjük megbízhatónak. A mentett tartalmat szerveroldalon is szanitizálni kell (pl. DOMPurify, sanitize-html). A JSON kimenet biztonságosabb alap, mert nem tartalmaz tetszőleges HTML-t, de a link `href` értékeket azt is validálni kell.
- A link bővítmény csak a `http`, `https`, `mailto`, `tel` protokollokat engedélyezi (`javascript:` tiltott). Ez konfigurálható.
- Külső tartalom beillesztésekor (paste) a TipTap séma szűri a nem támogatott elemeket.

**Elérhetőség (a11y)**

- A szerkeszthető terület `role="textbox"`, `aria-multiline="true"` és konfigurálható `aria-label` attribútumot kap.
- Minden toolbar gombnak van `aria-label` és `aria-pressed` állapota.
- Teljes billentyűzetes kezelhetőség, látható fókuszjelzés.

---

## 11. Tesztelési Stratégia

- **Unit (Vitest + jsdom):** konstruktor opciók, `get*`/`setContent`, `emitUpdate` viselkedés, események, `destroy()` idempotencia, `features` szűrés, link protokoll szűrés.
- **Kimeneti formátum:**
  - `outputFormat: 'html'` és `'json'` esetén a `getValue()`, az `onUpdate` és az `update` esemény típusa helyes.
  - A `getHTML()` és a `getJSON()` formátumtól függetlenül működik.
  - HTML és JSON bemenet is elfogadott bármelyik kimeneti formátum mellett.
  - Érvénytelen formátumra hibát dob.
  - A kimeneti formátum futásidejű váltása működik.
- **Web Component:** regisztráció, attribútumok és property-k, események, `disconnectedCallback` cleanup, form érték beküldése HTML és JSON módban.
- **Komponens teszt (Vue Test Utils):** `v-model` kétirányú kötés HTML és JSON módban, unmount utáni cleanup, SSR render hiba nélkül.
- **Csomag és build teszt:**
  - `npm pack --dry-run`: csak a `dist` kerül bele, az `exports` útvonalak léteznek, a `.d.ts` fájlok megvannak.
  - Smoke teszt a `playground/plain.html`-lel: egyetlen `<script>` taggel működik, Vue és bundler nélkül.
  - Ellenőrzés, hogy a fő entry (`bonsai-editor`) bundle-jében nincs Vue.

---

## 12. Fejlesztési Ütemterv (Milestones)

1. **Fázis – Környezet:** projekt inicializálás, Vite (npm + standalone konfig), TipTap v3 StarterKit integráció Vanilla JS-ben, playground oldalak, ESLint/Prettier.
2. **Fázis – Core API:** konstruktor opciók, kimeneti formátum (`outputFormat`, `getValue`, `getContent(format)`), eseménykezelők (`onCreate`, `onUpdate`, `onFocus`, `onBlur`, `onSelectionUpdate`, `onDestroy`), `get*`/`setContent`/`focus`/`setEditable`/`destroy`, `tiptap` getter.
3. **Fázis – Tesztek és típusok:** Vitest tesztek a Core-ra (köztük a HTML/JSON kimenet), JSDoc + `.d.ts` generálás.
4. **Fázis – Stílusok:** névtérezett CSS, CSS változók, tipográfia, doboz keret, fókusz/disabled/placeholder állapotok, stílusinjektálás (`injectStyles`).
5. **Fázis – Web Component és standalone build:** `<bonsai-editor>` elem (attribútumok, események, form integráció), `standalone.js`, IIFE és ES CDN build, `plain.html` smoke teszt build eszköz és Vue nélkül.
6. **Fázis – Toolbar (opcionális):** minimális vanilla toolbar, aktív állapotok, a11y, bekötés a Core-ba és a Web Componentbe.
7. **Fázis – Vue 3 wrapper:** `BonsaiVueEditor` komponens `v-model` támogatással (HTML és JSON), komponens tesztek, SSR ellenőrzés.
8. **Fázis – Csomagolás:** `exports` map, `files`, `sideEffects`, `unpkg`/`jsdelivr` mezők, `npm pack --dry-run`, tesztelés helyi `npm link`-kel (a teszt alkalmazásban `resolve.dedupe: ['vue']`, hogy a Vue ne duplikálódjon).
9. **Fázis – Dokumentáció és publikálás:** README (telepítés, API, kimeneti formátum, témázás, CDN és keretrendszeres receptek: vanilla, React, Svelte, Angular, Vue), LICENSE, CHANGELOG, semver verziózás, CI workflow (lint + test + build), `npm publish`.
