import React from 'react'
import { Group } from '@/types'

interface RecentActivityProps {
  groups: Group[]
  isLoading?: boolean
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ groups, isLoading }) => {
  const recent = groups.slice(0, 5)

  return (
    <div className="rounded-2xl backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 p-5">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Recent Groups</h3>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-3 w-32 rounded mb-1.5" />
                <div className="skeleton h-2.5 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-4">No groups yet</p>
      ) : (
        <div className="space-y-3">
          {recent.map((group) => (
            <div key={group.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{group.name}</p>
                <p className="text-white/50 text-xs">{group.currentMembers}/{group.maxMembers} members</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                group.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : group.status === 'paused'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}>
                {group.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
