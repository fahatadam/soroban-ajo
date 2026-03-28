import { attachAuthHeaders, type InterceptorHandlers } from './interceptors'
import type { ApiRequestConfig } from './apiTypes'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type ApiClientOptions = {
  baseURL: string
  /** Retries after transient failures (network, 408, 429, 5xx). Default 3. */
  maxRetries?: number
  interceptors?: InterceptorHandlers[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function resolveUrl(baseURL: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = baseURL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) return p
  return `${base}${p}`
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 408 || status === 429 || (status >= 500 && status <= 599)
  )
}

export class ApiClient {
  private readonly baseURL: string
  private readonly maxRetries: number
  private readonly interceptors: InterceptorHandlers[]

  constructor(options: ApiClientOptions) {
    this.baseURL = options.baseURL
    this.maxRetries = options.maxRetries ?? 3
    this.interceptors = options.interceptors ?? []
  }

  async request<T>(config: ApiRequestConfig): Promise<T> {
    const method = config.method ?? 'GET'
    const parseAs = config.parseAs ?? 'json'
    const url = resolveUrl(this.baseURL, config.path)

    const headers = new Headers(config.headers ?? {})
    if (
      config.body !== undefined &&
      config.body !== null &&
      !headers.has('Content-Type')
    ) {
      headers.set('Content-Type', 'application/json')
    }

    const init: RequestInit = {
      method,
      headers,
      body:
        config.body !== undefined && config.body !== null
          ? headers.get('Content-Type')?.includes('application/json')
            ? JSON.stringify(config.body)
            : (config.body as BodyInit)
          : undefined,
    }

    let ctx = attachAuthHeaders({ url, init, config })

    for (const i of this.interceptors) {
      if (i.onRequest) ctx = await i.onRequest(ctx)
    }

    const response = config.skipRetry
      ? await fetch(ctx.url, ctx.init)
      : await this.fetchWithRetry(ctx.url, ctx.init)

    let res = response
    for (const i of this.interceptors) {
      if (i.onResponse) res = await i.onResponse(res)
    }

    if (parseAs === 'blob') {
      if (!res.ok) {
        const errBody = await safeJson(res)
        throw new ApiError(
          messageFromBody(errBody, res.statusText),
          res.status,
          errBody,
        )
      }
      return (await res.blob()) as T
    }

    if (parseAs === 'text') {
      const text = await res.text()
      if (!res.ok) {
        throw new ApiError(text || res.statusText, res.status, text)
      }
      return text as T
    }

    const data = await safeJson(res)
    if (!res.ok) {
      throw new ApiError(messageFromBody(data, res.statusText), res.status, data)
    }
    return data as T
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<Response> {
    try {
      const res = await fetch(url, init)
      if (isRetryableStatus(res.status) && attempt < this.maxRetries) {
        await sleep(2 ** attempt * 300)
        return this.fetchWithRetry(url, init, attempt + 1)
      }
      return res
    } catch {
      if (attempt < this.maxRetries) {
        await sleep(2 ** attempt * 300)
        return this.fetchWithRetry(url, init, attempt + 1)
      }
      throw new ApiError('Network request failed', 0)
    }
  }
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const e = (body as { error?: unknown }).error
    if (typeof e === 'string') return e
  }
  return fallback
}

const backendBase =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** Calls to the Express/Soroban backend (`NEXT_PUBLIC_API_URL`). */
export const backendApiClient = new ApiClient({
  baseURL: backendBase,
})

/** Same-origin Next.js `/api/*` route handlers. */
export const nextApiClient = new ApiClient({ baseURL: '' })
