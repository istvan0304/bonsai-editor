import { describe, it, expect, afterEach } from 'vitest'
import { BonsaiEditor } from '../src/core/editor.js'

/** @type {BonsaiEditor[]} */
const editors = []

afterEach(() => {
  while (editors.length) {
    editors.pop()?.destroy()
  }
})

describe('insert media', () => {
  it('inserts image from url', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p></p>',
      toolbar: ['insertMedia'],
    })
    editors.push(editor)

    editor.insertMediaFromUrl('https://example.com/test.jpg', { title: 'Teszt kép' })
    const html = editor.getHTML()
    expect(html).toMatch(/<img[^>]+src="https:\/\/example.com\/test.jpg"/)
    expect(html).toMatch(/alt="Teszt kép"/)
  })

  it('persists image dimensions in html', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p></p>',
    })
    editors.push(editor)

    editor.tiptap
      .chain()
      .focus()
      .setImage({ src: 'https://example.com/sized.jpg', width: 320, height: 180 })
      .run()

    const html = editor.getHTML()
    expect(html).toMatch(/width="320"/)
    expect(html).toMatch(/height="180"/)
  })

  it('inserts youtube embed', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const editor = new BonsaiEditor({
      element,
      content: '<p></p>',
    })
    editors.push(editor)

    editor.insertMediaFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(editor.getHTML()).toMatch(/youtube|data-youtube-video/i)
  })
})
