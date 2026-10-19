import { describe, it, expect, afterEach, vi } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'
import {
  buildPrintableDocumentHtml,
  exportHtmlAsPdf,
  exportHtmlViaPrint,
  sanitizePdfFileName,
} from '../src/core/pdf-export.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
  vi.restoreAllMocks()
})

describe('pdf export utils', () => {
  it('builds printable html with title and content', () => {
    const doc = buildPrintableDocumentHtml('<p>Teszt</p>', { title: 'Jelentés' })
    expect(doc).toContain('<title>Jelentés</title>')
    expect(doc).toContain('<p>Teszt</p>')
    expect(doc).toContain('bonsai-pdf-body')
  })

  it('sanitizes file names', () => {
    expect(sanitizePdfFileName('  Éves / jelentés  ')).toBe('Éves-jelentés.pdf')
    expect(sanitizePdfFileName('doc.pdf')).toBe('doc.pdf')
  })
})

describe('pdf export from editor', () => {
  it('exports via print when method is print', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p>PDF tartalom</p>',
      toolbar: ['exportPdf'],
    })
    editors.push(editor)

    const printSpy = vi.fn()
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'iframe') {
        /** @type {{ onafterprint: (() => void) | null }} */
        const frame = {
          document: { open: vi.fn(), write: vi.fn(), close: vi.fn(), readyState: 'complete' },
          focus: vi.fn(),
          print: () => {
            printSpy()
            frame.onafterprint?.()
          },
          onafterprint: null,
          onload: null,
        }
        Object.defineProperty(el, 'contentWindow', { value: frame })
      }
      return el
    })

    await exportHtmlAsPdf('<p>x</p>', { method: 'print', title: 'Teszt' })
    expect(printSpy).toHaveBeenCalled()
  })

  it('editor.exportPdf opens print with current html', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p><strong>Export</strong></p>',
    })
    editors.push(editor)

    const printSpy = vi.fn()
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'iframe') {
        /** @type {{ onafterprint: (() => void) | null }} */
        const frame = {
          document: {
            open: vi.fn(),
            write: vi.fn(),
            close: vi.fn(),
            readyState: 'complete',
          },
          focus: vi.fn(),
          print: () => {
            printSpy()
            frame.onafterprint?.()
          },
          onafterprint: null,
          onload: null,
        }
        Object.defineProperty(el, 'contentWindow', { value: frame })
      }
      return el
    })

    await editor.exportPdf({ method: 'print', title: 'Demo' })
    expect(printSpy).toHaveBeenCalled()
    expect(editor.getHTML()).toMatch(/<strong>Export<\/strong>/)
  })
})

describe('exportHtmlViaPrint', () => {
  it('rejects when iframe has no contentWindow', async () => {
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'iframe') {
        Object.defineProperty(el, 'contentWindow', { value: null })
      }
      return el
    })

    await expect(exportHtmlViaPrint('<p></p>')).rejects.toThrow(/keret/)
  })
})
