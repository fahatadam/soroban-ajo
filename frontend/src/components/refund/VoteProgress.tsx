'use client'

import React from 'react'
import type { RefundRequest } from '@/hooks/useRefund'

interface Props {
  request: RefundRequest
  totalMembers: number
}

export function VoteProgress({ request, totalMembers }: Props) {
  const votes = Object.values(request.votes)
  const yes = votes.filter((v) => v === 'yes').length
  const no = votes.filter((v) => v === 'no').length
  const total = votes.length
  const majority = Math.ceil(totalMembers / 2)

  const yesPercent = totalMembers ? Math.round((yes / totalMembers) * 100) : 0
  const noPercent = totalMembers ? Math.round((no / totalMembers) * 100) : 0

  const deadline = new Date(request.votingDeadline)
  const isExpired = deadline < new Date()
  const timeLeft = isExpired
    ? 'Expired'
    : `${Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 3_600_000))}h remaining`

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-gray-500">
        <span>{total} of {totalMembers} voted · {majority} needed</span>
        <span className={isExpired ? 'text-red-500' : 'text-gray-400'}>{timeLeft}</span>
      </div>

      {/* Yes bar */}
      <div>
        <div className="flex justify-between mb-0.5">
          <span className="text-green-700 font-medium">Yes</span>
          <span className="text-green-700">{yes} ({yesPercent}%)</span>
        </div>
        <div className="h-2 rounded bg-gray-100 overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${yesPercent}%` }} />
        </div>
      </div>

      {/* No bar */}
      <div>
        <div className="flex justify-between mb-0.5">
          <span className="text-red-700 font-medium">No</span>
          <span className="text-red-700">{no} ({noPercent}%)</span>
        </div>
        <div className="h-2 rounded bg-gray-100 overflow-hidden">
          <div className="h-full bg-red-500 transition-all" style={{ width: `${noPercent}%` }} />
        </div>
      </div>
    </div>
  )
}
