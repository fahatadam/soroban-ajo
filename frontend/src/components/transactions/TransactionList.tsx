'use client'

import React from 'react'
import type { TrackedTransaction, TxStatus } from '@/hooks/useTransactionStatus'

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx'

const STATUS_BADGE: Record<TxStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

interface Props {
  transactions: TrackedTransaction[]
  loading?: boolean
  error?: string | null
  onRetry?: (txHash: string) => void
  onRefresh?: () => void
}

export function TransactionList({ transactions, loading, error, onRetry, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex justify-between items-center">
        <span>{error}</span>
        {onRefresh && (
          <button onClick={onRefresh} className="text-blue-600 hover:underline text-xs ml-4">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">No transactions yet.</div>
    )
  }

  return (
    <div className="space-y-1">
      {onRefresh && (
        <div className="flex justify-end mb-2">
          <button onClick={onRefresh} className="text-xs text-blue-600 hover:underline">
            Refresh
          </button>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden divide-y">
        {transactions.map((tx) => (
          <div key={tx.txHash} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium text-gray-800">{tx.type}</span>
                {tx.amount && (
                  <span className="text-gray-500 text-xs">{tx.amount} stroops</span>
                )}
              </div>
              <a
                href={`${EXPLORER_BASE}/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:underline truncate"
              >
                {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
              </a>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[tx.status]}`}>
                {tx.status}
              </span>

              {tx.status === 'failed' && onRetry && (
                <button
                  onClick={() => onRetry(tx.txHash)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Retry
                </button>
              )}

              <span className="text-xs text-gray-400 hidden sm:block">
                {new Date(tx.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
