import { ApiClient } from './apiClient'

function mockResponse(ok: boolean, status: number, body: string) {
  return {
    ok,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
    blob: async () => new Blob([body]),
  }
}

describe('ApiClient', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('parses JSON on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(true, 200, '{"x":42}'))
    const client = new ApiClient({ baseURL: '', maxRetries: 0 })
    const data = await client.request<{ x: number }>({ path: '/api/test' })
    expect(data.x).toBe(42)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('throws ApiError on error JSON body', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(mockResponse(false, 400, '{"error":"bad"}'))
    const client = new ApiClient({ baseURL: '', maxRetries: 0 })
    await expect(client.request({ path: '/api/test' })).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'bad',
        status: 400,
      }),
    )
  })

  it('resolves absolute URLs without base', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(true, 200, 'null'))
    const client = new ApiClient({ baseURL: 'http://localhost:3001', maxRetries: 0 })
    await client.request({ path: 'https://example.com/x' })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/x',
      expect.anything(),
    )
  })

  it('returns blob when parseAs is blob', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      blob: async () => new Blob(['hi']),
    })
    const client = new ApiClient({ baseURL: '', maxRetries: 0 })
    const b = await client.request<Blob>({
      path: '/api/file',
      parseAs: 'blob',
    })
    expect(b).toBeInstanceOf(Blob)
  })
})
