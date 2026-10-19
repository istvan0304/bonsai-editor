/** Nyomtatáshoz / PDF-hez: a szerkesztő tartalomstílusainak megfelelő CSS. */
const PDF_BODY_STYLES = `
.bonsai-pdf-body {
  box-sizing: border-box;
  max-width: 100%;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #111827;
}
.bonsai-pdf-body p { margin: 0.5rem 0; }
.bonsai-pdf-body h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
.bonsai-pdf-body h2 { font-size: 1.5rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.bonsai-pdf-body h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.bonsai-pdf-body h4 { font-size: 1.125rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.bonsai-pdf-body h5 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.bonsai-pdf-body h6 { font-size: 0.875rem; font-weight: 600; margin: 0.75rem 0 0.5rem; color: #4b5563; }
.bonsai-pdf-body ul, .bonsai-pdf-body ol { padding-left: 1.5rem; margin: 0.5rem 0; }
.bonsai-pdf-body blockquote {
  border-left: 3px solid #d1d5db;
  margin: 0.5rem 0;
  padding-left: 1rem;
  color: #4b5563;
}
.bonsai-pdf-body table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0.75rem 0;
}
.bonsai-pdf-body td, .bonsai-pdf-body th {
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.55rem;
  vertical-align: top;
}
.bonsai-pdf-body th {
  background: #f1f5f9;
  font-weight: 600;
  text-align: left;
}
.bonsai-pdf-body pre {
  background: #1f2937;
  color: #f9fafb;
  border-radius: 0.25rem;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  font-size: 0.875rem;
  white-space: pre-wrap;
}
.bonsai-pdf-body code {
  background: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-size: 0.875em;
}
.bonsai-pdf-body sub, .bonsai-pdf-body sup { font-size: 0.75em; }
.bonsai-pdf-body hr {
  border: none;
  border-top: 1px solid #d1d5db;
  margin: 1rem 0;
}
.bonsai-pdf-body img {
  max-width: 100%;
  height: auto;
}
.bonsai-pdf-body a { color: #2563eb; text-decoration: underline; }
@media print {
  body { margin: 0; padding: 12mm 14mm; }
  .bonsai-pdf-body table { page-break-inside: auto; }
  .bonsai-pdf-body tr { page-break-inside: avoid; page-break-after: auto; }
}
`

/**
 * @typedef {{
 *   title?: string;
 *   fileName?: string;
 *   method?: 'print';
 * }} PdfExportOptions
 */

/**
 * @param {string} input
 */
export function sanitizePdfFileName(input) {
  const base = String(input)
    .trim()
    // eslint-disable-next-line no-control-regex -- strip ASCII control chars from file names
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  const stem = base || 'dokumentum'
  return stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`
}

/**
 * @param {string} html
 * @param {{ title?: string }} [options]
 */
export function buildPrintableDocumentHtml(html, { title = 'Dokumentum' } = {}) {
  const safeTitle = String(title)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>${PDF_BODY_STYLES}</style>
</head>
<body>
<div class="bonsai-pdf-body">${html}</div>
</body>
</html>`
}

/**
 * @param {string} html
 * @param {PdfExportOptions} [options]
 * @returns {Promise<void>}
 */
export async function exportHtmlAsPdf(html, options = {}) {
  await exportHtmlViaPrint(html, options)
}

/**
 * @param {string} html
 * @param {PdfExportOptions} [options]
 * @returns {Promise<void>}
 */
export async function exportHtmlViaPrint(html, options = {}) {
  const title = options.title ?? options.fileName?.replace(/\.pdf$/i, '') ?? 'Dokumentum'
  const docHtml = buildPrintableDocumentHtml(html, { title })

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', title)
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(iframe)

  const frameWin = iframe.contentWindow
  if (!frameWin) {
    iframe.remove()
    throw new Error('PDF export: a nyomtatási keret nem érhető el.')
  }

  const doc = frameWin.document
  doc.open()
  doc.write(docHtml)
  doc.close()

  return new Promise((resolve, reject) => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let fallbackTimer

    const cleanup = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer)
      iframe.remove()
    }

    const finish = () => {
      cleanup()
      resolve()
    }

    frameWin.onafterprint = finish
    fallbackTimer = setTimeout(finish, 120_000)

    const startPrint = () => {
      try {
        frameWin.focus()
        frameWin.print()
      } catch (err) {
        cleanup()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }

    if (doc.readyState === 'complete') startPrint()
    else frameWin.onload = startPrint
  })
}
