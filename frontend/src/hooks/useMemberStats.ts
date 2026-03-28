import { useMemo } from 'react'
import { useGroupMembers, useTransactions } from './useContractData'

export interface ContributionEntry {
  cycle: number
  amount: number
  timestamp: string
  status: 'confirmed' | 'pending' | 'failed'
}

export type AchievementId =
  | 'first_contribution'
  | 'perfect_streak'
  | 'early_bird'
  | 'top_contributor'
  | 'veteran'

export interface Achievement {
  id: AchievementId
  label: string
  description: string
  earned: boolean
}

/**
 * Performance and participation statistics for an individual member.
 */
export interface MemberStats {
  /** Reliability score (0-100) based on on-time contributions */
  reliabilityScore: number
  totalContributed: number
  /** Total number of successful contribution transactions */
  contributions: number
  cyclesCompleted: number
  history: ContributionEntry[]
  achievements: Achievement[]
  /** Relative rank in the group by total contribution amount */
  rank: number
  isCreator: boolean
}

function computeReliability(contributions: number, cyclesCompleted: number): number {
  if (cyclesCompleted === 0) return 100
  return Math.min(100, Math.round((contributions / cyclesCompleted) * 100))
}

function buildAchievements(stats: {
  contributions: number
  cyclesCompleted: number
  reliabilityScore: number
  isCreator: boolean
  rank: number
  totalMembers: number
}): Achievement[] {
  return [
    {
      id: 'first_contribution',
      label: 'First Step',
      description: 'Made your first contribution',
      earned: stats.contributions >= 1,
    },
    {
      id: 'perfect_streak',
      label: 'Perfect Streak',
      description: '100% on-time contributions',
      earned: stats.reliabilityScore === 100 && stats.contributions >= 3,
    },
    {
      id: 'early_bird',
      label: 'Early Bird',
      description: 'Joined in the first cycle',
      earned: stats.isCreator,
    },
    {
      id: 'top_contributor',
      label: 'Top Contributor',
      description: 'Highest total in the group',
      earned: stats.rank === 1 && stats.totalMembers > 1,
    },
    {
      id: 'veteran',
      label: 'Veteran',
      description: 'Completed 5+ cycles',
      earned: stats.cyclesCompleted >= 5,
    },
  ]
}

/**
 * Hook to compute detailed participation stats and gamified achievements 
 * for a specific member within a group.
 * 
 * @param address - Wallet address of the member
 * @param groupId - Target group contract ID
 * @returns Calculated member stats and loading state
 */
export function useMemberStats(
  address: string,
  groupId: string
): { stats: MemberStats; loading: boolean } {
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(groupId)
  const { data: txData, isLoading: txLoading } = useTransactions(groupId)

  const stats = useMemo<MemberStats>(() => {
    const member = members.find((m) => m.address === address)
    const allTx = (txData as any)?.transactions ?? txData ?? []

    const memberTx: ContributionEntry[] = (allTx as any[])
      .filter((t) => t.member === address && t.type === 'contribution')
      .map((t, i) => ({
        cycle: i + 1,
        amount: t.amount,
        timestamp: t.timestamp ?? t.date ?? '',
        status: t.status === 'confirmed' || t.status === 'completed' ? 'confirmed'
          : t.status === 'pending' ? 'pending' : 'failed',
      }))

    const contributions = member?.contributions ?? memberTx.length
    const cyclesCompleted = member?.cyclesCompleted ?? contributions
    const totalContributed = member?.totalContributed ?? memberTx.reduce((s, t) => s + t.amount, 0)
    const reliabilityScore = computeReliability(contributions, cyclesCompleted)

    // Rank by totalContributed descending
    const sorted = [...members].sort((a, b) => (b.totalContributed ?? 0) - (a.totalContributed ?? 0))
    const rank = sorted.findIndex((m) => m.address === address) + 1 || 1
    const isCreator = members[0]?.address === address

    const achievements = buildAchievements({
      contributions,
      cyclesCompleted,
      reliabilityScore,
      isCreator,
      rank,
      totalMembers: members.length,
    })

    return {
      reliabilityScore,
      totalContributed,
      contributions,
      cyclesCompleted,
      history: memberTx,
      achievements,
      rank,
      isCreator,
    }
  }, [address, members, txData])

  return { stats, loading: membersLoading || txLoading }
}
