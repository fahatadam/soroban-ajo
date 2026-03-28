'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const POLL_INTERVAL_MS = 4_000

export type TxStatus = 'pending' | 'confirmed' | 'failed'

export interface TrackedTransaction {
  txHash: string
  status: TxStatus
  type: string
  amount?: string
  groupId?: string
  ledger?: number
  errorMessage?: string
  submittedAt: string
  confirmedAt?: string
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ajo_auth_token')
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Track a single transaction, polling until terminal ──────────────────────

export function useTransactionStatus(txHash: string | null) {
  const [tx, setTx] = useState<TrackedTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetch_ = useCallback(async () => {
    if (!txHash) return
    try {
      const data = await apiFetch<TrackedTransaction>(`/api/transactions/${txHash}`)
      setTx(data)
      if (data.status === 'pending') {
        timerRef.current = setTimeout(fetch_, POLL_INTERVAL_MS)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    }
  }, [txHash])

  useEffect(() => {
    if (!txHash) return
    setLoading(true)
    setError(null)
    fetch_().finally(() => setLoading(false))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [txHash, fetch_])

  const retry = useCallback(async () => {
    if (!txHash) return
    await apiFetch(`/api/transactions/${txHash}/retry`, { method: 'POST' })
    setTx((prev) => prev ? { ...prev, status: 'pending' } : prev)
    timerRef.current = setTimeout(fetch_, POLL_INTERVAL_MS)
  }, [txHash, fetch_])

  return { tx, loading, error, retry }
}

// ── List all transactions for the current wallet ─────────────────────────────

export function useTransactionList(limit = 20) {
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ data: TrackedTransaction[] }>(
        `/api/transactions?limit=${limit}`
      )
      setTransactions(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { refresh() }, [refresh])

  const track = useCallback(
    async (txHash: string, type: string, opts?: { groupId?: string; amount?: string }) => {
      await apiFetch('/api/transactions/track', {
        method: 'POST',
        body: JSON.stringify({ txHash, type, ...opts }),
      })
      refresh()
    },
    [refresh]
  )

  return { transactions, loading, error, refresh, track }
}
