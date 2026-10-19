/**
 * @param {{ BonsaiEditor: typeof import('../src/core/editor.js').BonsaiEditor }} deps
 */
export function initDemo({ BonsaiEditor }) {
  const mainEl = document.getElementById('editor-main')
  const outMain = document.getElementById('out-main')
  const formatLabel = document.getElementById('format-label')
  const formatTabs = document.querySelectorAll('[role="tablist"] button[data-format]')
  const copyBtn = document.getElementById('copy-main')
  const themeButtons = document.querySelectorAll('.theme-picker button')

  let outputFormat = 'html'

  const searchParams = new URLSearchParams(window.location.search)
  const demoUserId = searchParams.get('user') || searchParams.get('userId') || 'demo-user'
  const demoLocale = searchParams.get('lang') || searchParams.get('locale') || undefined

  const mainEditor = new BonsaiEditor({
    element: mainEl,
    locale: demoLocale,
    content: [
      '<h2>Üdv a demóban</h2>',
      '<p>Az eszköztár <strong>ikonokat</strong> használ; a címsor a lenyíló menüből választható (1–6).</p>',
      '<ul><li>Félkövér, dőlt, listák</li><li>Címsor lenyíló</li><li>Forráskód gomb (&lt;/&gt;)</li></ul>',
      '<blockquote>Próbáld ki a jobb oldali HTML ↔ JSON váltást.</blockquote>',
    ].join(''),
    menubar: true,
    toolbar: true,
    placeholder: 'Kezdj el írni…',
    outputFormat,
    fileManager: {
      userId: demoUserId,
      uploadUrl: '/api/uploads',
      listUrl: '/api/uploads',
      deleteUrl: '/api/uploads',
    },
    onUpdate: (value) => renderMainOutput(value),
  })

  function renderMainOutput(value) {
    if (outputFormat === 'json') {
      outMain.textContent = JSON.stringify(value, null, 2)
    } else {
      outMain.textContent = value
    }
  }

  renderMainOutput(mainEditor.getValue())

  formatTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      outputFormat = btn.dataset.format
      formatTabs.forEach((b) => {
        b.classList.toggle('is-active', b === btn)
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false')
      })
      formatLabel.textContent = outputFormat.toUpperCase()
      mainEditor.outputFormat = outputFormat
      renderMainOutput(mainEditor.getValue())
    })
  })

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(outMain.textContent)
      copyBtn.textContent = 'Másolva!'
      setTimeout(() => {
        copyBtn.textContent = 'Másolás'
      }, 1500)
    } catch {
      copyBtn.textContent = 'Sikertelen'
    }
  })

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      themeButtons.forEach((b) => b.classList.toggle('is-active', b === btn))
      mainEl.classList.remove('theme-ocean', 'theme-forest', 'theme-plum')
      const t = btn.dataset.theme
      if (t !== 'default') mainEl.classList.add('theme-' + t)
    })
  })

  const wc = document.getElementById('wc')
  const outWc = document.getElementById('out-wc')
  wc.addEventListener('bonsai-update', (e) => {
    outWc.textContent =
      typeof e.detail.value === 'string' ? e.detail.value : JSON.stringify(e.detail.value, null, 2)
  })
  wc.addEventListener('bonsai-ready', () => {
    outWc.textContent = wc.value
  })

  const outJson = document.getElementById('out-json')
  const jsonEditor = new BonsaiEditor({
    element: document.getElementById('editor-json'),
    content: '<p>JSON kimenet</p><ol><li>Első</li><li>Második</li></ol>',
    outputFormat: 'json',
    toolbar: true,
    onUpdate: (doc) => {
      outJson.textContent = JSON.stringify(doc, null, 2)
    },
  })
  outJson.textContent = JSON.stringify(jsonEditor.getJSON(), null, 2)

  const buildError = document.getElementById('build-error')
  if (buildError) buildError.hidden = true
}
