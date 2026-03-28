import React from 'react'

interface GroupHeaderProps {
  groupId: string
  groupName: string
  status: string
  memberCount: number
  maxMembers: number
  cycleLength: number
  contributionAmount: number
  totalCollected: number
  isLoading?: boolean
  onInvite?: () => void
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupId,
  groupName,
  status,
  memberCount,
  maxMembers,
  cycleLength,
  contributionAmount,
  totalCollected,
  isLoading,
  onInvite,
}) => {
  const statusColor = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    paused: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }[status] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30'

  const fillPct = Math.round((memberCount / maxMembers) * 100)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border border-white/10 p-6">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 rounded-full filter blur-3xl opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{isLoading ? '...' : groupName}</h2>
            <p className="text-white/40 text-sm mt-1 font-mono">ID: {groupId}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              {isLoading ? '...' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {onInvite && (
              <button
                onClick={onInvite}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Invite
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Members', value: isLoading ? '...' : `${memberCount}/${maxMembers}` },
            { label: 'Cycle Length', value: isLoading ? '...' : `${cycleLength}d` },
            { label: 'Contribution', value: isLoading ? '...' : `$${contributionAmount}` },
            { label: 'Total Collected', value: isLoading ? '...' : `$${totalCollected}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white font-bold text-lg">{value}</p>
            </div>
          ))}
        </div>

        {/* Member fill progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>Member capacity</span>
            <span>{fillPct}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
