import React from 'react'
import { Member } from '@/types'

interface MemberCardProps {
  member: Member
  groupId: string
  rank?: number
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, rank }) => {
  const initials = member.address.slice(0, 2).toUpperCase()
  const shortAddress = `${member.address.slice(0, 6)}...${member.address.slice(-4)}`

  const statusColor = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }[member.status]

  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 group">
      {rank && rank <= 3 && (
        <div className="absolute top-3 right-3 text-lg">{['🥇', '🥈', '🥉'][rank - 1]}</div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-sm truncate font-mono">{shortAddress}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
            {member.status}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 mb-0.5">Contributed</p>
          <p className="text-white font-semibold">{member.totalContributed} XLM</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 mb-0.5">Cycles</p>
          <p className="text-white font-semibold">{member.cyclesCompleted}</p>
        </div>
      </div>
    </div>
  )
}
