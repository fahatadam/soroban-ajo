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

const v1Router = Router()

v1Router.use('/auth', createIpLimiter('auth'), authRouter)
v1Router.use('/groups', createUserLimiter(), groupsRouter)
v1Router.use('/webhooks', createIpLimiter('auth'), webhooksRouter)
v1Router.use('/analytics', createUserLimiter(), analyticsRouter)
v1Router.use('/email', emailRouter)
v1Router.use('/jobs', jobsRouter)
v1Router.use('/gamification', createIpLimiter('expensive'), createUserLimiter(), gamificationRouter)
v1Router.use('/goals', createUserLimiter(), goalsRouter)
v1Router.use('/kyc', kycRouter)
v1Router.use('/disputes', disputesRouter)
v1Router.use('/rewards', rewardsRouter)
v1Router.use('/referrals', referralsRouter)
v1Router.use('/chat', createUserLimiter(), chatRouter)
v1Router.use('/notifications', createUserLimiter(), notificationsRouter)
v1Router.use('/activity', activityRouter)
v1Router.use('/reports', reportsRouter)

export { v1Router }
