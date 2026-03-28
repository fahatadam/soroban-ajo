import React from 'react'

interface GroupPreviewProps {
  data: {
    groupName: string
    description?: string
    cycleLength: number
    contributionAmount: number
    maxMembers: number
    frequency: 'weekly' | 'monthly'
    duration: number
    invitedMembers: string[]
  }
}

export const GroupPreview: React.FC<GroupPreviewProps> = ({ data }) => {
  const totalPool = data.contributionAmount * data.maxMembers
  const totalCycles = data.duration
  const payoutPerMember = totalPool

  const rows = [
    { label: 'Cycle Length', value: `${data.cycleLength} days` },
    { label: 'Frequency', value: data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1) },
    { label: 'Duration', value: `${data.duration} cycles` },
    { label: 'Max Members', value: data.maxMembers },
    { label: 'Contribution / Cycle', value: `$${data.contributionAmount.toFixed(2)}` },
    { label: 'Pool per Cycle', value: `$${totalPool.toFixed(2)}` },
    { label: 'Payout per Member', value: `$${payoutPerMember.toFixed(2)}` },
    { label: 'Total Cycles', value: totalCycles },
  ]

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-5">
      <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-1">
        {data.groupName || 'Unnamed Group'}
      </h3>
      {data.description && (
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">{data.description}</p>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-blue-600 dark:text-blue-400">{label}</dt>
            <dd className="text-sm font-semibold text-blue-900 dark:text-blue-100">{value}</dd>
          </div>
        ))}
      </dl>

      {data.invitedMembers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            Invited Members ({data.invitedMembers.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {data.invitedMembers.map((m) => (
              <span key={m} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-mono">
                {m.slice(0, 8)}…
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
