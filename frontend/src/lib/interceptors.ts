import type { ApiRequestConfig } from './apiTypes'

export type RequestPhaseContext = {
  url: string
  init: RequestInit
  config: ApiRequestConfig
}

export type InterceptorHandlers = {
  /** Transform the outgoing request before `fetch`. */
  onRequest?: (
    ctx: RequestPhaseContext,
  ) => RequestPhaseContext | Promise<RequestPhaseContext>
  /** Inspect or transform the raw `Response` before body parsing. */
  onResponse?: (response: Response) => Response | Promise<Response>
}

export function mergeHeaders(
  base: HeadersInit | undefined,
  extra: Record<string, string>,
): Headers {
  const h = new Headers(base ?? {})
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) h.set(k, v)
  }
  return h
}

function readToken(key: 'token' | 'adminToken'): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

/** Attaches `Authorization` when `config.bearerToken` or `config.auth` requests it. */
export function attachAuthHeaders(
  ctx: RequestPhaseContext,
): RequestPhaseContext {
  const { config } = ctx
  if (config.bearerToken) {
    const headers = mergeHeaders(ctx.init.headers as HeadersInit | undefined, {
      Authorization: `Bearer ${config.bearerToken}`,
    })
    return { ...ctx, init: { ...ctx.init, headers } }
  }

  const auth = config.auth ?? 'none'
  if (auth === 'none') return ctx

  const token =
    auth === 'admin' ? readToken('adminToken') : readToken('token')
  if (!token) return ctx

  const headers = mergeHeaders(ctx.init.headers as HeadersInit | undefined, {
    Authorization: `Bearer ${token}`,
  })

  return {
    ...ctx,
    init: { ...ctx.init, headers },
  }
}
