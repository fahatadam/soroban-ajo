'use client'

import React, { useState } from 'react'

interface Props {
  groupId: string
  onSubmit: (data: { reason: string; amount?: string }) => Promise<void>
  isLoading?: boolean
}

export function RefundRequestForm({ onSubmit, isLoading }: Props) {
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!reason.trim()) return setError('Please provide a reason.')
    try {
      await onSubmit({ reason: reason.trim(), amount: amount || undefined })
      setSuccess(true)
      setReason('')
      setAmount('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        ✅ Refund request submitted. Members have been notified to vote.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Explain why you are requesting a refund..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (stroops, optional)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Leave blank for full refund"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Submitting…' : 'Request Refund'}
      </button>
    </form>
  )
}
