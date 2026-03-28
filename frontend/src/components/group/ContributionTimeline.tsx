import React from 'react'
import { Transaction } from '@/types'

interface ContributionTimelineProps {
  transactions: Transaction[]
  isLoading?: boolean
}

export const ContributionTimeline: React.FC<ContributionTimelineProps> = ({ transactions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="skeleton h-3 w-32 rounded mb-1.5" />
              <div className="skeleton h-2.5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!transactions.length) {
    return <p className="text-white/40 text-sm text-center py-6">No transactions yet</p>
  }

  const typeConfig = {
    contribution: { icon: '💰', color: 'from-emerald-500 to-teal-600', label: 'Contribution' },
    payout: { icon: '💸', color: 'from-indigo-500 to-purple-600', label: 'Payout' },
    refund: { icon: '↩️', color: 'from-amber-500 to-orange-600', label: 'Refund' },
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10" />
      <div className="space-y-4">
        {transactions.map((tx, i) => {
          const config = typeConfig[tx.type]
          return (
            <div key={tx.id} className="flex gap-4 items-start relative">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-sm flex-shrink-0 z-10`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium">{config.label}</p>
                  <p className={`text-sm font-bold ${tx.type === 'payout' ? 'text-indigo-300' : 'text-emerald-300'}`}>
                    {tx.type === 'payout' ? '+' : '-'}{tx.amount} XLM
                  </p>
                </div>
                <p className="text-white/40 text-xs mt-0.5">
                  {new Date(tx.timestamp || tx.date || '').toLocaleDateString()} · {tx.member.slice(0, 8)}...
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                  tx.status === 'confirmed' || tx.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : tx.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
