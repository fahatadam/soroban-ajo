import { useMemo } from 'react'
import { backendApiClient, nextApiClient, type ApiClient } from '@/lib/apiClient'

export type ApiClients = {
  /** Next.js App Router `/api/*` (same origin). */
  next: ApiClient
  /** External backend from `NEXT_PUBLIC_API_URL`. */
  backend: ApiClient
}

/**
 * Stable access to shared API clients for use in components and hooks.
 * Prefer `next` for BFF routes and `backend` for direct backend calls.
 */
export function useApi(): ApiClients {
  return useMemo(
    () => ({
      next: nextApiClient,
      backend: backendApiClient,
    }),
    [],
  )
}
