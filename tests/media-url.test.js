import { describe, it, expect } from 'vitest'
import {
  detectMediaKind,
  getVimeoEmbedUrl,
  normalizeMediaUrl,
} from '../src/core/media-url-utils.js'

describe('media url utils', () => {
  it('normalizes urls', () => {
    expect(normalizeMediaUrl('example.com/a.jpg')).toBe('https://example.com/a.jpg')
    expect(normalizeMediaUrl('javascript:alert(1)')).toBeNull()
  })

  it('detects media kinds', () => {
    expect(detectMediaKind('https://example.com/photo.png')).toBe('image')
    expect(detectMediaKind('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    expect(detectMediaKind('https://vimeo.com/123456789')).toBe('vimeo')
    expect(detectMediaKind('https://cdn.example.com/clip.mp4')).toBe('video')
    expect(detectMediaKind('https://cdn.example.com/sound.mp3')).toBe('audio')
  })

  it('builds vimeo embed url', () => {
    expect(getVimeoEmbedUrl('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    )
  })
})
