import { redisClient } from '../services/cacheService'
import { createModuleLogger } from './logger'
import { getCacheKeyPatterns } from './cacheKeys'

const logger = createModuleLogger('CacheInvalidation')

/**
 * Cache invalidation strategies for different operations
 * Ensures data consistency across the application
 */

export class CacheInvalidationManager {
  /**
   * Invalidate all cache keys matching a pattern
   * Uses Redis SCAN to avoid blocking on large datasets
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      let cursor = '0'
      let deletedCount = 0
      const batchSize = 100

      do {
        const [newCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize)
        cursor = newCursor

        if (keys.length > 0) {
          const deleted = await redisClient.del(...keys)
          deletedCount += deleted
          logger.debug('Invalidated cache keys', { pattern, count: deleted })
        }
      } while (cursor !== '0')

      return deletedCount
    } catch (error) {
      logger.error('Failed to invalidate cache pattern', { pattern, error })
      throw error
    }
  }

  /**
   * Invalidate specific individual cache keys.
   * 
   * @param keys - Array of exact Redis keys to remove
   * @returns Promise resolving to the number of keys successfully deleted
   */
  static async invalidateKeys(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0

    try {
      const deleted = await redisClient.del(...keys)
      logger.debug('Invalidated cache keys', { count: deleted, keys: keys.length })
      return deleted
    } catch (error) {
      logger.error('Failed to invalidate cache keys', { error, keyCount: keys.length })
      throw error
    }
  }

  /**
   * Invalidate a single, specific cache key.
   * 
   * @param key - The exact key to remove
   * @returns Promise resolving to true if a key was deleted, false otherwise
   */
  static async invalidateKey(key: string): Promise<boolean> {
    try {
      const deleted = await redisClient.del(key)
      if (deleted > 0) {
        logger.debug('Invalidated cache key', { key })
      }
      return deleted > 0
    } catch (error) {
      logger.error('Failed to invalidate cache key', { key, error })
      throw error
    }
  }

  /**
   * Invalidate all user-related caches
   * Called when user profile is updated
   */
  static async invalidateUserCache(walletAddress: string): Promise<number> {
    const pattern = getCacheKeyPatterns.userAll(walletAddress)
    return this.invalidatePattern(pattern)
  }

  /**
   * Invalidate all group-related caches
   * Called when group is updated
   */
  static async invalidateGroupCache(groupId: string): Promise<number> {
    const pattern = getCacheKeyPatterns.groupAll(groupId)
    return this.invalidatePattern(pattern)
  }

  /**
   * Invalidate all goal-related caches for a user
   * Called when goal is created/updated/deleted
   */
  static async invalidateUserGoalsCache(walletAddress: string): Promise<number> {
    const pattern = getCacheKeyPatterns.goalAll(walletAddress)
    return this.invalidatePattern(pattern)
  }

  /**
   * Invalidate leaderboard caches
   * Called when user stats change significantly
   */
  static async invalidateLeaderboardCache(): Promise<number> {
    const pattern = getCacheKeyPatterns.leaderboardAll()
    return this.invalidatePattern(pattern)
  }

  /**
   * Invalidate activity feed caches
   * Called when new activity is recorded
   */
  static async invalidateActivityCache(): Promise<number> {
    const pattern = getCacheKeyPatterns.activityAll()
    return this.invalidatePattern(pattern)
  }

  /**
   * Invalidate referral-related caches
   * Called when referral is created/redeemed
   */
  static async invalidateReferralCache(walletAddress: string): Promise<number> {
    const pattern = getCacheKeyPatterns.referralAll(walletAddress)
    return this.invalidatePattern(pattern)
  }

  /**
   * Invalidate reward-related caches
   * Called when reward is created/redeemed
   */
  static async invalidateRewardCache(walletAddress: string): Promise<number> {
    const pattern = getCacheKeyPatterns.rewardAll(walletAddress)
    return this.invalidatePattern(pattern)
  }

  /**
   * Cascade invalidation for group member changes
   * When a user joins/leaves a group, invalidate both user and group caches
   */
  static async invalidateGroupMembershipChange(groupId: string, walletAddress: string): Promise<number> {
    const groupDeleted = await this.invalidateGroupCache(groupId)
    const userDeleted = await this.invalidateUserCache(walletAddress)
    return groupDeleted + userDeleted
  }

  /**
   * Cascade invalidation for contribution
   * When contribution is made, invalidate group, user, and leaderboard caches
   */
  static async invalidateContributionChange(groupId: string, walletAddress: string): Promise<number> {
    const groupDeleted = await this.invalidateGroupCache(groupId)
    const userDeleted = await this.invalidateUserCache(walletAddress)
    const leaderboardDeleted = await this.invalidateLeaderboardCache()
    return groupDeleted + userDeleted + leaderboardDeleted
  }

  /**
   * Cascade invalidation for gamification events
   * When points/achievements change, invalidate user and leaderboard caches
   */
  static async invalidateGamificationChange(walletAddress: string): Promise<number> {
    const userDeleted = await this.invalidateUserCache(walletAddress)
    const leaderboardDeleted = await this.invalidateLeaderboardCache()
    const activityDeleted = await this.invalidateActivityCache()
    return userDeleted + leaderboardDeleted + activityDeleted
  }

  /**
   * Strategically flushes the entire Redis database.
   * CAUTION: Use only during major system maintenance or emergency resets.
   * 
   * @returns Promise resolving to 1 if successful
   */
  static async invalidateAll(): Promise<number> {
    try {
      const flushed = await redisClient.flushdb()
      logger.warn('Flushed entire Redis database')
      return flushed ? 1 : 0
    } catch (error) {
      logger.error('Failed to flush Redis database', { error })
      throw error
    }
  }
}

export default CacheInvalidationManager
