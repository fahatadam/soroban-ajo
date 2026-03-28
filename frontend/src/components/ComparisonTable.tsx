import React from 'react'
import { Group } from '@/types'

interface ComparisonTableProps {
  groups: Group[]
  onRemove: (id: string) => void
}

const METRICS: { key: keyof Group; label: string; format?: (v: unknown) => string }[] = [
  { key: 'contributionAmount', label: 'Contribution', format: v => `$${v}` },
  { key: 'cycleLength', label: 'Cycle Length', format: v => `${v} days` },
  { key: 'maxMembers', label: 'Max Members', format: v => String(v) },
  { key: 'currentMembers', label: 'Current Members', format: v => String(v) },
  { key: 'totalContributions', label: 'Total Collected', format: v => `$${v}` },
  { key: 'status', label: 'Status', format: v => String(v) },
]

function getBest(groups: Group[], key: keyof Group): string | null {
  const numericKeys: (keyof Group)[] = ['totalContributions', 'currentMembers']
  if (!numericKeys.includes(key)) return null
  const vals = groups.map(g => Number(g[key]))
  const max = Math.max(...vals)
  return groups.find(g => Number(g[key]) === max)?.id ?? null
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ groups, onRemove }) => {
  if (!groups.length) return null

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-4 text-white/40 font-medium w-36">Metric</th>
            {groups.map(g => (
              <th key={g.id} className="p-4 text-center min-w-[160px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {g.name.charAt(0)}
                  </div>
                  <span className="text-white font-semibold truncate max-w-[120px]">{g.name}</span>
                  <button
                    onClick={() => onRemove(g.id)}
                    className="text-white/30 hover:text-red-400 transition-colors text-xs"
                    aria-label={`Remove ${g.name}`}
                  >
                    ✕ Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map(({ key, label, format }) => {
            const bestId = getBest(groups, key)
            return (
              <tr key={key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-white/50 font-medium">{label}</td>
                {groups.map(g => {
                  const val = g[key]
                  const isBest = bestId === g.id
                  return (
                    <td key={g.id} className="p-4 text-center">
                      <span className={`font-semibold ${isBest ? 'text-emerald-400' : 'text-white'}`}>
                        {format ? format(val) : String(val)}
                        {isBest && <span className="ml-1 text-xs">★</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
