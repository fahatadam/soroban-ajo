export type ApiAuthMode = 'none' | 'user' | 'admin'

export type ApiResponseParse = 'json' | 'blob' | 'text'

export interface ApiRequestConfig {
  /** Path beginning with `/`, or an absolute `http(s)` URL. */
  path: string
  method?: string
  body?: unknown
  headers?: HeadersInit
  /** Explicit bearer token (e.g. fresh session token not yet in storage). */
  bearerToken?: string
  /** Which stored token to attach, if any. Default `none`. */
  auth?: ApiAuthMode
  /** How to read the response body. Default `json`. */
  parseAs?: ApiResponseParse
  /** Skip retry wrapper (e.g. for one-shot analytics beacons). */
  skipRetry?: boolean
}
