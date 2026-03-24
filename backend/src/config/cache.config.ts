import { z } from 'zod'
import { createModuleLogger } from '../utils/logger'

const logger = createModuleLogger('CacheConfig')

// Cache configuration schema
const cacheConfigSchema = z.object({
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  CACHE_ENABLED: z.string().transform(v => v === 'true').default('true'),
  CACHE_DEFAULT_TTL: z.string().transform(Number).default('300'), // 5 minutes
  CACHE_MAX_MEMORY: z.string().default('256mb'),
  CACHE_EVICTION_POLICY: z.enum(['noeviction', 'allkeys-lru', 'allkeys-lfu', 'volatile-lru', 'volatile-lfu']).default('allkeys-lru'),
})

export type CacheConfig = z.infer<typeof cacheConfigSchema>

function loadCacheConfig(): CacheConfig {
  try {
    return cacheConfigSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid cache configuration, using defaults')
      error.errors.forEach((err) => {
        logger.warn('Cache config issue', {
          path: err.path.join('.'),
          message: err.message,
        })
      })
    }
    return cacheConfigSchema.parse({})
  }
}

export const cacheConfig = loadCacheConfig()

// TTL configurations by data type (in seconds)
export const CACHE_TTL = {
  // User data - moderate TTL since profiles update frequently
  USER_PROFILE: 600, // 10 minutes
  USER_STATS: 300, // 5 minutes
  USER_ACHIEVEMENTS: 600, // 10 minutes

  // Group data - longer TTL, groups are relatively static
  GROUP_DETAILS: 900, // 15 minutes
  GROUP_MEMBERS: 600, // 10 minutes
  GROUP_CONTRIBUTIONS: 300, // 5 minutes
  GROUP_LIST: 600, // 10 minutes

  // Goal data - moderate TTL
  GOAL_DETAILS: 600, // 10 minutes
  GOAL_LIST: 300, // 5 minutes

  // Gamification data - shorter TTL for real-time feel
  LEADERBOARD: 300, // 5 minutes
  ACTIVITY_FEED: 180, // 3 minutes
  POINTS_BALANCE: 300, // 5 minutes

  // Referral data - moderate TTL
  REFERRAL_CODE: 1800, // 30 minutes
  REFERRAL_STATS: 600, // 10 minutes

  // Reward data - moderate TTL
  REWARD_LIST: 600, // 10 minutes
  REWARD_HISTORY: 300, // 5 minutes

  // Analytics - longer TTL, less frequently updated
  ANALYTICS_METRICS: 1800, // 30 minutes
  ANALYTICS_EVENTS: 600, // 10 minutes

  // API responses - general purpose
  API_RESPONSE: 300, // 5 minutes
} as const

// Cache key prefixes for organization
export const CACHE_PREFIX = {
  USER: 'user',
  GROUP: 'group',
  GOAL: 'goal',
  CONTRIBUTION: 'contribution',
  LEADERBOARD: 'leaderboard',
  ACTIVITY: 'activity',
  REFERRAL: 'referral',
  REWARD: 'reward',
  ANALYTICS: 'analytics',
  SESSION: 'session',
  TEMP: 'temp',
} as const

// Cache patterns for invalidation
export const CACHE_PATTERNS = {
  USER_ALL: `${CACHE_PREFIX.USER}:*`,
  GROUP_ALL: `${CACHE_PREFIX.GROUP}:*`,
  GOAL_ALL: `${CACHE_PREFIX.GOAL}:*`,
  LEADERBOARD_ALL: `${CACHE_PREFIX.LEADERBOARD}:*`,
  ACTIVITY_ALL: `${CACHE_PREFIX.ACTIVITY}:*`,
} as const
