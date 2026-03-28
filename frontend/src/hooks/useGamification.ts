'use client'

import { useEffect, useMemo, useState } from 'react'

export interface Achievement {
  id: string
  title: string
  description: string
  category: 'consistency' | 'social' | 'milestone' | 'rewards'
  icon: string
  unlocked: boolean
  current: number
  target: number
  xpReward: number
  unlockedAt?: string
  recentlyUnlocked?: boolean
}

export interface LeaderboardEntry {
  id: string
  name: string
  xp: number
  level: number
  position: number
  change: number
  isCurrentUser?: boolean
}

export interface Reward {
  id: string
  title: string
  description: string
  cost: number
  status: 'locked' | 'available' | 'redeemed'
}

export interface GamificationData {
  level: number
  xp: number
  rank: number
  nextLevelXp: number
  achievements: Achievement[]
  leaderboards: {
    global: LeaderboardEntry[]
    group: LeaderboardEntry[]
    friends: LeaderboardEntry[]
  }
  rewards: Reward[]
}

const LEVEL_XP_THRESHOLDS = [0, 250, 600, 1100, 1800, 2800, 4200]
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { timestamp: number; data: GamificationData }>()

function hashSeed(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function readRedeemedRewardIds(address: string) {
  if (typeof window === 'undefined') {
    return new Set<string>()
  }

  const raw = window.localStorage.getItem(`gamification:rewards:${address}`)
  if (!raw) {
    return new Set<string>()
  }

  try {
    return new Set<string>(JSON.parse(raw) as string[])
  } catch {
    return new Set<string>()
  }
}

function persistRedeemedRewardIds(address: string, rewardIds: string[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(`gamification:rewards:${address}`, JSON.stringify(rewardIds))
}

export function getLevelFromXP(xp: number) {
  let level = 1
  for (let index = 0; index < LEVEL_XP_THRESHOLDS.length; index += 1) {
    if (xp >= LEVEL_XP_THRESHOLDS[index]) {
      level = index + 1
    }
  }
  return level
}

export function getLevelFloorXP(level: number) {
  return LEVEL_XP_THRESHOLDS[Math.max(0, Math.min(level - 1, LEVEL_XP_THRESHOLDS.length - 1))]
}

export function getNextLevelXP(level: number) {
  return LEVEL_XP_THRESHOLDS[Math.min(level, LEVEL_XP_THRESHOLDS.length - 1)]
}

export function getLevelProgress(xp: number) {
  const level = getLevelFromXP(xp)
  const floor = getLevelFloorXP(level)
  const ceiling = getNextLevelXP(level)

  if (ceiling <= floor) {
    return 100
  }

  return Math.max(0, Math.min(100, ((xp - floor) / (ceiling - floor)) * 100))
}

function buildAchievements(seed: number, xp: number) {
  const weeklyContributions = 2 + (seed % 7)
  const inviteCount = 1 + (seed % 5)
  const streak = 3 + (seed % 12)
  const redeemedRewards = seed % 3
  const savingsCycles = 1 + (seed % 6)

  const items: Achievement[] = [
    {
      id: 'streak-starter',
      title: 'Streak Starter',
      description: 'Contribute for 7 straight days.',
      category: 'consistency',
      icon: 'S',
      unlocked: streak >= 7,
      current: streak,
      target: 7,
      xpReward: 120,
    },
    {
      id: 'circle-builder',
      title: 'Circle Builder',
      description: 'Invite 3 friends into your savings network.',
      category: 'social',
      icon: 'C',
      unlocked: inviteCount >= 3,
      current: inviteCount,
      target: 3,
      xpReward: 140,
    },
    {
      id: 'steady-saver',
      title: 'Steady Saver',
      description: 'Complete 5 weekly contributions.',
      category: 'milestone',
      icon: 'P',
      unlocked: weeklyContributions >= 5,
      current: weeklyContributions,
      target: 5,
      xpReward: 160,
    },
    {
      id: 'reward-runner',
      title: 'Reward Runner',
      description: 'Redeem 2 rewards from the dashboard.',
      category: 'rewards',
      icon: 'R',
      unlocked: redeemedRewards >= 2,
      current: redeemedRewards,
      target: 2,
      xpReward: 90,
    },
    {
      id: 'cycle-finisher',
      title: 'Cycle Finisher',
      description: 'Finish 4 savings cycles.',
      category: 'milestone',
      icon: 'F',
      unlocked: savingsCycles >= 4,
      current: savingsCycles,
      target: 4,
      xpReward: 180,
    },
  ]

  const recentlyUnlockedId = items.find((achievement) => achievement.unlocked && xp - achievement.xpReward < 160)?.id
  const unlockDate = new Date(Date.UTC(2026, 2, 1 + (seed % 25))).toISOString()

  return items.map((achievement) => ({
    ...achievement,
    unlockedAt: achievement.unlocked ? unlockDate : undefined,
    recentlyUnlocked: achievement.id === recentlyUnlockedId,
  }))
}

function buildLeaderboardEntries(
  seed: number,
  scope: 'global' | 'group' | 'friends',
  userLabel: string,
  currentXp: number,
) {
  const baseNames =
    scope === 'global'
      ? ['Nora', 'Dami', 'Lina', 'Kai', 'Amara', 'Tobi']
      : scope === 'group'
        ? ['Wave Pool', 'Core Circle', 'Alpha Pod', 'Thrift Team', 'Node Crew', 'Trust Loop']
        : ['Maya', 'Chris', 'Ella', 'Ife', 'Sam', 'Bola']

  const entries = baseNames.map((name, index) => {
    const entryXp = currentXp + 260 - index * 110 + ((seed + index * 17) % 60)
    return {
      id: `${scope}-${index}`,
      name,
      xp: Math.max(180, entryXp),
      level: getLevelFromXP(Math.max(180, entryXp)),
      position: index + 1,
      change: ((seed + index) % 5) - 2,
    }
  })

  const currentUserEntry = {
    id: `${scope}-current-user`,
    name: userLabel,
    xp: currentXp,
    level: getLevelFromXP(currentXp),
    position: 1,
    change: 1,
    isCurrentUser: true,
  }

  const merged = [...entries, currentUserEntry]
    .sort((left, right) => right.xp - left.xp)
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }))

  return merged.slice(0, scope === 'global' ? 7 : 6)
}

function buildRewards(xp: number, redeemedRewardIds: Set<string>): Reward[] {
  return [
    {
      id: 'fee-discount',
      title: 'Contribution Fee Discount',
      description: 'Apply a 10% fee discount to your next contribution cycle.',
      cost: 450,
      status: redeemedRewardIds.has('fee-discount')
        ? 'redeemed'
        : xp >= 450
          ? 'available'
          : 'locked',
    },
    {
      id: 'priority-slot',
      title: 'Priority Group Slot',
      description: 'Unlock an early seat in a featured savings circle.',
      cost: 900,
      status: redeemedRewardIds.has('priority-slot')
        ? 'redeemed'
        : xp >= 900
          ? 'available'
          : 'locked',
    },
    {
      id: 'vault-theme',
      title: 'Vault Theme Pack',
      description: 'Redeem a premium dashboard skin for your profile space.',
      cost: 1500,
      status: redeemedRewardIds.has('vault-theme')
        ? 'redeemed'
        : xp >= 1500
          ? 'available'
          : 'locked',
    },
  ]
}

export function buildGamificationData(address = 'guest-address'): GamificationData {
  const seed = hashSeed(address)
  const xp = 380 + (seed % 2100)
  const level = getLevelFromXP(xp)
  const rank = 18 + (seed % 160)
  const userLabel = address.length > 10 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address
  const redeemedRewardIds = readRedeemedRewardIds(address)

  return {
    level,
    xp,
    rank,
    nextLevelXp: getNextLevelXP(level),
    achievements: buildAchievements(seed, xp),
    leaderboards: {
      global: buildLeaderboardEntries(seed, 'global', userLabel, xp),
      group: buildLeaderboardEntries(seed + 27, 'group', userLabel, xp),
      friends: buildLeaderboardEntries(seed + 49, 'friends', userLabel, xp),
    },
    rewards: buildRewards(xp, redeemedRewardIds),
  }
}

function getCachedData(address: string) {
  const item = cache.get(address)
  if (!item) {
    return null
  }

  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(address)
    return null
  }

  return item.data
}

function setCachedData(address: string, data: GamificationData) {
  cache.set(address, {
    timestamp: Date.now(),
    data,
  })
}

/**
 * Hook for managing user gamification state, including levels, XP, and achievements.
 * Currently uses mock data generation based on the user's wallet address.
 * 
 * @param address - Optional wallet address to seed the mock data
 * @returns Object containing user level, XP, achievements, and leaderboard data
 */
export function useGamification(address?: string) {
  const cacheKey = useMemo(() => address || 'guest-address', [address])
  const [data, setData] = useState<GamificationData | null>(() => getCachedData(cacheKey))
  const [loading, setLoading] = useState(!getCachedData(cacheKey))

  useEffect(() => {
    let active = true
    const cached = getCachedData(cacheKey)

    if (cached) {
      setData(cached)
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    const timer = window.setTimeout(() => {
      if (!active) {
        return
      }

      const nextData = buildGamificationData(cacheKey)
      setCachedData(cacheKey, nextData)
      setData(nextData)
      setLoading(false)
    }, 160)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [cacheKey])

  const redeemReward = (rewardId: string) => {
    setData((current) => {
      if (!current) {
        return current
      }

      const targetReward = current.rewards.find((reward) => reward.id === rewardId)
      if (!targetReward || targetReward.status !== 'available') {
        return current
      }

      const redeemedRewardIds = current.rewards
        .filter((reward) => reward.status === 'redeemed')
        .map((reward) => reward.id)
        .concat(rewardId)

      persistRedeemedRewardIds(cacheKey, redeemedRewardIds)

      const nextData = {
        ...current,
        rewards: current.rewards.map((reward) =>
          reward.id === rewardId
            ? { ...reward, status: 'redeemed' as const }
            : reward
        ),
      }

      setCachedData(cacheKey, nextData)
      return nextData
    })
  }

  return {
    loading,
    level: data?.level ?? 1,
    xp: data?.xp ?? 0,
    rank: data?.rank ?? 0,
    nextLevelXp: data?.nextLevelXp ?? getNextLevelXP(1),
    achievements: data?.achievements ?? [],
    leaderboards: data?.leaderboards ?? { global: [], group: [], friends: [] },
    rewards: data?.rewards ?? [],
    redeemReward,
  }
}

export const gamificationTestUtils = {
  clearCache() {
    cache.clear()
  },
}
