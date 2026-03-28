'use client'

import React, { useState } from 'react'
import type { RefundRequest } from '@/hooks/useRefund'
import { VoteProgress } from './VoteProgress'

const STATUS_BADGE: Record<RefundRequest['status'], string> = {
  pending: 'bg-gray-100 text-gray-600',
  voting: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  executed: 'bg-blue-100 text-blue-700',
}

interface Props {
  request: RefundRequest
  totalMembers: number
  currentUserAddress?: string
  onVote: (id: string, vote: 'yes' | 'no') => Promise<void>
  onExecute: (id: string, txHash: string) => Promise<void>
  isVoting?: boolean
  isExecuting?: boolean
}

export function RefundVoting({
  request,
  totalMembers,
  currentUserAddress,
  onVote,
  onExecute,
  isVoting,
  isExecuting,
}: Props) {
  const [txHash, setTxHash] = useState('')
  const [execError, setExecError] = useState<string | null>(null)

  const hasVoted = currentUserAddress ? request.votes[currentUserAddress] !== undefined : false
  const myVote = currentUserAddress ? request.votes[currentUserAddress] : undefined
  const canExecute = request.status === 'approved'
  const isExpired = new Date(request.votingDeadline) < new Date()

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault()
    setExecError(null)
    if (!txHash.trim()) return setExecError('Transaction hash is required.')
    try {
      await onExecute(request.id, txHash.trim())
    } catch (err: any) {
      setExecError(err.message)
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{request.reason}</p>
          {request.amount && (
            <p className="text-gray-500 text-xs mt-0.5">{request.amount} stroops</p>
          )}
          <p className="text-gray-400 text-xs mt-0.5">
            by {request.requestedBy.slice(0, 8)}… · {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_BADGE[request.status]}`}>
          {request.status}
        </span>
      </div>

      {/* Vote progress */}
      <VoteProgress request={request} totalMembers={totalMembers} />

      {/* Vote buttons */}
      {request.status === 'voting' && !isExpired && currentUserAddress && (
        <div className="flex gap-2">
          <button
            onClick={() => onVote(request.id, 'yes')}
            disabled={isVoting || hasVoted}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${myVote === 'yes' ? 'bg-green-600 text-white' : 'border border-green-600 text-green-700 hover:bg-green-50'}
              disabled:opacity-50`}
          >
            {myVote === 'yes' ? '✓ Voted Yes' : 'Vote Yes'}
          </button>
          <button
            onClick={() => onVote(request.id, 'no')}
            disabled={isVoting || hasVoted}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${myVote === 'no' ? 'bg-red-600 text-white' : 'border border-red-600 text-red-700 hover:bg-red-50'}
              disabled:opacity-50`}
          >
            {myVote === 'no' ? '✓ Voted No' : 'Vote No'}
          </button>
        </div>
      )}

      {/* Execute refund */}
      {canExecute && (
        <form onSubmit={handleExecute} className="space-y-2 pt-2 border-t">
          <p className="text-green-700 font-medium">Refund approved — enter on-chain tx hash to execute</p>
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Transaction hash"
            className="w-full rounded border px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {execError && <p className="text-red-600 text-xs">{execError}</p>}
          <button
            type="submit"
            disabled={isExecuting}
            className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isExecuting ? 'Executing…' : 'Execute Refund'}
          </button>
        </form>
      )}

      {/* Executed */}
      {request.status === 'executed' && request.txHash && (
        <p className="text-blue-600 text-xs">
          Executed ·{' '}
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${request.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on explorer
          </a>
        </p>
      )}
    </div>
  )
}
