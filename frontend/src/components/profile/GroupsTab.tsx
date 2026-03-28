import React from 'react'
import type { UserStats } from '@/types/profile'

interface GroupsTabProps {
  stats: UserStats
}

export const GroupsTab: React.FC<GroupsTabProps> = ({ stats }) => {
  const cards = [
    { label: 'Active Groups', value: stats.activeGroups, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Completed Groups', value: stats.completedGroups, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Groups', value: stats.totalGroups, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Success Rate', value: `${stats.successRate.toFixed(0)}%`, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Total Contributions</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">${stats.totalContributions.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Total Payouts</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">${stats.totalPayouts.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
