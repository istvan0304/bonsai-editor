import { initDemo } from './init.js'

const GlobalEditor = globalThis.BonsaiEditor
const BonsaiEditor = GlobalEditor?.default ?? GlobalEditor

if (!BonsaiEditor) {
  const el = document.getElementById('build-error')
  if (el) el.hidden = false
} else {
  initDemo({ BonsaiEditor })
}
