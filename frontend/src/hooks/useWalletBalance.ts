import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAccountBalanceInfo,
  getLockedBalance,
  getRecentTxHistory,
  RecentTx,
} from '../services/soroban'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WalletBalance {
  /** Total XLM on the account */
  total: number
  /** Available to spend: total − locked − minReserve */
  available: number
  /** XLM locked inside active Ajo groups */
  lockedInGroups: number
  /** Stellar minimum reserve (cannot be spent) */
  minReserve: number
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

const EMPTY: WalletBalance = {
  total: 0,
  available: 0,
  lockedInGroups: 0,
  minReserve: 1,
  isLoading: false,
  error: null,
  lastUpdated: null,
}

const POLL_MS = 30_000 // refresh every 30 seconds

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve and periodically refresh the XLM balance of a Stellar account.
 * Calculates total, available, and locked (in-contract) balances.
 * 
 * Features:
 * - POLLING for real-time balance updates
 * - AUTOMATIC refetching when address changes
 * - AGGREGATION of locked balances across group contracts
 * 
 * @param address - The Stellar public key to monitor
 * @returns Balance state and a manual refetch trigger
 */
export function useWalletBalance(address: string | null | undefined) {
  const [balance, setBalance] = useState<WalletBalance>(EMPTY)
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([])

  // Use a ref so the interval always sees the latest address without re-creating
  const addressRef = useRef(address)
  addressRef.current = address

  const fetchBalance = useCallback(async () => {
    const key = addressRef.current
    if (!key) {
      setBalance(EMPTY)
      setRecentTxs([])
      return
    }

    setBalance((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const [accountInfo, locked, txHistory] = await Promise.all([
        getAccountBalanceInfo(key),
        getLockedBalance(key),
        getRecentTxHistory(key),
      ])

      const total = parseFloat(accountInfo.nativeBalance)
      const available = Math.max(0, total - locked - accountInfo.minReserve)

      setBalance({
        total,
        available,
        lockedInGroups: locked,
        minReserve: accountInfo.minReserve,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      })

      setRecentTxs(txHistory)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch balance'
      setBalance((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, []) // stable — reads address via ref

  // Fetch whenever address changes
  useEffect(() => {
    fetchBalance()
  }, [address, fetchBalance])

  // Poll on interval
  useEffect(() => {
    if (!address) return
    const id = setInterval(fetchBalance, POLL_MS)
    return () => clearInterval(id)
  }, [address, fetchBalance])

  return {
    balance,
    recentTxs,
    /**
     * Call refetch() immediately after a successful transaction to update
     * the displayed balance without waiting for the next poll cycle.
     */
    refetch: fetchBalance,
  }
}
