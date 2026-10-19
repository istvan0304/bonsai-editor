import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  normalizeUploadResponse,
  uploadFileToServer,
  listFilesFromServer,
  browseDirectory,
  appendUserIdToRequestUrl,
} from '../src/files/file-upload.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('file upload client', () => {
  it('normalizes JSON upload responses', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const meta = normalizeUploadResponse(
      { file: { id: 'abc', url: '/files/abc', name: 'photo.png', type: 'image/png', size: 1 } },
      file,
    )
    expect(meta.url).toBe('/files/abc')
    expect(meta.id).toBe('abc')
    expect(meta.remote).toBe(true)
  })

  it('uploads multipart data to uploadUrl', async () => {
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ url: 'https://cdn.example/a.txt', name: 'a.txt', type: 'text/plain', size: 5 }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await uploadFileToServer(file, { uploadUrl: '/api/uploads' }, 'docs')
    expect(result.url).toBe('https://cdn.example/a.txt')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/uploads?path=docs',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    )
  })

  it('appends userId to upload and browse requests', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ url: '/f/a.txt', name: 'a.txt', type: 'text/plain', size: 1 }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    await uploadFileToServer(file, { uploadUrl: '/api/uploads', userId: 'user-42' }, '')
    expect(fetchMock.mock.calls[0][0]).toContain('userId=user-42')
    expect(fetchMock.mock.calls[0][1].headers['X-Bonsai-User-Id']).toBe('user-42')

    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ path: '', parent: '', entries: [] }),
      })),
    )
    await browseDirectory({ uploadUrl: '/api/uploads', userId: 'user-42' }, '')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('userId=user-42')
  })

  it('appendUserIdToRequestUrl preserves existing query', () => {
    expect(appendUserIdToRequestUrl('/a?path=x', { userId: 'u1' })).toBe('/a?path=x&userId=u1')
  })

  it('browses directories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          path: 'images',
          parent: '',
          entries: [{ kind: 'dir', name: '2024', path: 'images/2024' }],
        }),
      })),
    )

    const listing = await browseDirectory({ uploadUrl: '/api/uploads' }, 'images')
    expect(listing.entries[0].name).toBe('2024')
  })

  it('lists remote files from browse API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          path: '',
          parent: '',
          entries: [{ kind: 'file', path: 'x.png', url: '/f/1', name: 'x.png', type: 'image/png', size: 10 }],
        }),
      })),
    )

    const files = await listFilesFromServer({ listUrl: '/api/uploads' })
    expect(files).toHaveLength(1)
    expect(files[0].url).toBe('/f/1')
  })
})
