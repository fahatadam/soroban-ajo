import { useState } from 'react'
import { ApiError, nextApiClient } from '@/lib/apiClient'
import { apiPaths } from '@/lib/apiEndpoints'

/**
 * Hook for executing and tracking cross-chain asset bridge operations.
 * Communicates with the BFF (Backend-for-Frontend) to initiate transfers
 * and poll for finality on the receiving chain.
 * 
 * @returns Methods for bridge initiation, status tracking, and history loading
 */
export function useBridge() {
  const [status, setStatus] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])

  async function initiate(request: any) {
    setStatus('initiating')
    try {
      const json = await nextApiClient.request<{ record?: unknown }>({
        path: apiPaths.bridge.initiate,
        method: 'POST',
        body: request,
      })
      setStatus('initiated')
      setHistory((h) => [json.record, ...h])
      return json.record
    } catch (e) {
      setStatus('error')
      const msg =
        e instanceof ApiError && e.body && typeof e.body === 'object' && 'error' in e.body
          ? String((e.body as { error?: unknown }).error)
          : e instanceof Error
            ? e.message
            : 'Bridge initiation failed'
      throw new Error(msg || 'Bridge initiation failed')
    }
  }

  async function getStatus(id: string) {
    try {
      return await nextApiClient.request({
        path: apiPaths.bridge.status(id),
      })
    } catch (e) {
      const msg =
        e instanceof ApiError && e.body && typeof e.body === 'object' && 'error' in e.body
          ? String((e.body as { error?: unknown }).error)
          : 'Failed to retrieve status'
      throw new Error(msg)
    }
  }

  async function loadHistory() {
    const json = await nextApiClient.request<{ history?: any[] }>({
      path: apiPaths.bridge.history,
    })
    if (json.history) setHistory(json.history)
    return json.history
  }

  return { status, initiate, getStatus, history, loadHistory }
}

export default useBridge
