import { Router } from 'express'
import { groupsRouter } from '../groups'
import { authRouter } from '../auth'
import { analyticsRouter } from '../analytics'
import { emailRouter } from '../email'
import { jobsRouter } from '../jobs'
import { gamificationRouter } from '../gamification'
import { goalsRouter } from '../goals'
import { kycRouter } from '../kyc'
import { disputesRouter } from '../disputes'
import rewardsRouter from '../rewards'
import referralsRouter from '../referrals'
import { chatRouter } from '../chat'
import { notificationsRouter } from '../notifications'
import { webhooksRouter } from '../webhooks'
import activityRouter from '../activity.routes'
import { reportsRouter } from '../reports'
import { createIpLimiter, createUserLimiter } from '../../middleware/rateLimiter'

/**
 * V2 API Router
 *
 * This router contains all API v2 endpoints.
 * V2 is the current active version with enhanced features:
 * - Improved response pagination (cursor-based)
 * - Enhanced error response structure
 * - Additional metadata in responses
 * - Deprecation of v1-only endpoints
 *
 * For v1 compatibility, most routes are re-exported from v1 implementations.
 * V2-specific route implementations should be created in separate files
 * when needed (e.g., ../v2/groups-v2.ts).
 */
const v2Router = Router()

// Resource routes with rate limiting
v2Router.use('/auth', createIpLimiter('auth'), authRouter)
v2Router.use('/groups', createUserLimiter(), groupsRouter)
v2Router.use('/webhooks', createIpLimiter('auth'), webhooksRouter)
v2Router.use('/analytics', createUserLimiter(), analyticsRouter)
v2Router.use('/email', emailRouter)
v2Router.use('/jobs', jobsRouter)
v2Router.use('/gamification', createIpLimiter('expensive'), createUserLimiter(), gamificationRouter)
v2Router.use('/goals', createUserLimiter(), goalsRouter)
v2Router.use('/kyc', kycRouter)
v2Router.use('/disputes', disputesRouter)
v2Router.use('/rewards', rewardsRouter)
v2Router.use('/referrals', referralsRouter)
v2Router.use('/chat', createUserLimiter(), chatRouter)
v2Router.use('/notifications', createUserLimiter(), notificationsRouter)
v2Router.use('/activity', activityRouter)
v2Router.use('/reports', reportsRouter)

export { v2Router }
