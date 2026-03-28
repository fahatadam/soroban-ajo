'use client'

import React from 'react'
import type { TrackedTransaction, TxStatus } from '@/hooks/useTransactionStatus'

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx'

const STATUS_STYLES: Record<TxStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<TxStatus, string> = {
  pending: '⏳ Pending',
  confirmed: '✅ Confirmed',
  failed: '❌ Failed',
}

interface Props {
  tx: TrackedTransaction | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function TransactionStatus({ tx, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border p-4 animate-pulse bg-gray-50">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!tx) return null

  return (
    <div className="rounded-lg border p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Transaction Status</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[tx.status]}`}>
          {STATUS_LABELS[tx.status]}
        </span>
      </div>

      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between">
          <span>Hash</span>
          <a
            href={`${EXPLORER_BASE}/${tx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-600 hover:underline truncate max-w-[200px]"
          >
            {tx.txHash.slice(0, 8)}…{tx.txHash.slice(-8)}
          </a>
        </div>

        <div className="flex justify-between">
          <span>Type</span>
          <span className="capitalize">{tx.type}</span>
        </div>

        {tx.amount && (
          <div className="flex justify-between">
            <span>Amount</span>
            <span>{tx.amount} stroops</span>
          </div>
        )}

        {tx.ledger && (
          <div className="flex justify-between">
            <span>Ledger</span>
            <span>{tx.ledger}</span>
          </div>
        )}

        {tx.confirmedAt && (
          <div className="flex justify-between">
            <span>Confirmed</span>
            <span>{new Date(tx.confirmedAt).toLocaleString()}</span>
          </div>
        )}

        {tx.errorMessage && (
          <div className="text-red-600 mt-1">{tx.errorMessage}</div>
        )}
      </div>

      {tx.status === 'failed' && onRetry && (
        <button
          onClick={onRetry}
          className="w-full mt-2 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          Retry Transaction
        </button>
      )}
    </div>
  )
}
