import { CACHE_PREFIX } from '../config/cache.config'

/**
 * Centralized cache key generation to ensure consistency across the application.
 * This prevents key collisions and makes invalidation patterns easier to manage.
 */

export const cacheKeys = {
  // User keys
  userProfile: (walletAddress: string) => `${CACHE_PREFIX.USER}:profile:${walletAddress}`,
  userStats: (walletAddress: string) => `${CACHE_PREFIX.USER}:stats:${walletAddress}`,
  userAchievements: (walletAddress: string) => `${CACHE_PREFIX.USER}:achievements:${walletAddress}`,
  userGamification: (walletAddress: string) => `${CACHE_PREFIX.USER}:gamification:${walletAddress}`,
  userGoals: (walletAddress: string) => `${CACHE_PREFIX.USER}:goals:${walletAddress}`,
  userActivity: (walletAddress: string) => `${CACHE_PREFIX.USER}:activity:${walletAddress}`,

  // Group keys
  groupDetails: (groupId: string) => `${CACHE_PREFIX.GROUP}:details:${groupId}`,
  groupMembers: (groupId: string) => `${CACHE_PREFIX.GROUP}:members:${groupId}`,
  groupContributions: (groupId: string) => `${CACHE_PREFIX.GROUP}:contributions:${groupId}`,
  groupContributionsByRound: (groupId: string, round: number) =>
    `${CACHE_PREFIX.GROUP}:contributions:${groupId}:round:${round}`,
  groupList: (filter?: string) => `${CACHE_PREFIX.GROUP}:list${filter ? `:${filter}` : ''}`,
  groupStats: (groupId: string) => `${CACHE_PREFIX.GROUP}:stats:${groupId}`,

  // Goal keys
  goalDetails: (goalId: string) => `${CACHE_PREFIX.GOAL}:details:${goalId}`,
  goalList: (walletAddress: string) => `${CACHE_PREFIX.GOAL}:list:${walletAddress}`,
  goalProgress: (goalId: string) => `${CACHE_PREFIX.GOAL}:progress:${goalId}`,

  // Contribution keys
  contributionHistory: (walletAddress: string) => `${CACHE_PREFIX.CONTRIBUTION}:history:${walletAddress}`,
  contributionStats: (walletAddress: string) => `${CACHE_PREFIX.CONTRIBUTION}:stats:${walletAddress}`,

  // Leaderboard keys
  leaderboardTopReferrers: (limit: number = 100) => `${CACHE_PREFIX.LEADERBOARD}:referrers:top:${limit}`,
  leaderboardTopSavers: (limit: number = 100) => `${CACHE_PREFIX.LEADERBOARD}:savers:top:${limit}`,
  leaderboardTopContributors: (limit: number = 100) => `${CACHE_PREFIX.LEADERBOARD}:contributors:top:${limit}`,
  leaderboardUserRank: (walletAddress: string, type: string) =>
    `${CACHE_PREFIX.LEADERBOARD}:rank:${type}:${walletAddress}`,

  // Activity keys
  activityFeed: (walletAddress: string, limit: number = 50) =>
    `${CACHE_PREFIX.ACTIVITY}:feed:${walletAddress}:${limit}`,
  activityGlobal: (limit: number = 100) => `${CACHE_PREFIX.ACTIVITY}:global:${limit}`,

  // Referral keys
  referralCode: (walletAddress: string) => `${CACHE_PREFIX.REFERRAL}:code:${walletAddress}`,
  referralStats: (walletAddress: string) => `${CACHE_PREFIX.REFERRAL}:stats:${walletAddress}`,
  referralHistory: (walletAddress: string) => `${CACHE_PREFIX.REFERRAL}:history:${walletAddress}`,

  // Reward keys
  rewardList: (filter?: string) => `${CACHE_PREFIX.REWARD}:list${filter ? `:${filter}` : ''}`,
  rewardHistory: (walletAddress: string) => `${CACHE_PREFIX.REWARD}:history:${walletAddress}`,
  rewardBalance: (walletAddress: string) => `${CACHE_PREFIX.REWARD}:balance:${walletAddress}`,

  // Analytics keys
  analyticsMetrics: (timeframe: string) => `${CACHE_PREFIX.ANALYTICS}:metrics:${timeframe}`,
  analyticsUserMetrics: (walletAddress: string) => `${CACHE_PREFIX.ANALYTICS}:user:${walletAddress}`,
  analyticsGroupMetrics: (groupId: string) => `${CACHE_PREFIX.ANALYTICS}:group:${groupId}`,

  // Session keys
  sessionData: (sessionId: string) => `${CACHE_PREFIX.SESSION}:${sessionId}`,

  // Temporary keys (for operations in progress)
  tempOperation: (operationId: string) => `${CACHE_PREFIX.TEMP}:op:${operationId}`,
} as const

/**
 * Get all cache keys matching a pattern (for invalidation)
 * Note: This is a helper for pattern-based invalidation
 */
export const getCacheKeyPatterns = {
  userAll: (walletAddress: string) => `${CACHE_PREFIX.USER}:*:${walletAddress}`,
  groupAll: (groupId: string) => `${CACHE_PREFIX.GROUP}:*:${groupId}`,
  goalAll: (walletAddress: string) => `${CACHE_PREFIX.GOAL}:*:${walletAddress}`,
  leaderboardAll: () => `${CACHE_PREFIX.LEADERBOARD}:*`,
  activityAll: () => `${CACHE_PREFIX.ACTIVITY}:*`,
  referralAll: (walletAddress: string) => `${CACHE_PREFIX.REFERRAL}:*:${walletAddress}`,
  rewardAll: (walletAddress: string) => `${CACHE_PREFIX.REWARD}:*:${walletAddress}`,
} as const
