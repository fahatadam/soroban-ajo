import { Router } from 'express'
import { getRewards, redeemReward, getRewardHistory } from '../controllers/rewardController'
import { validateRequest } from '../middleware/validateRequest'
import { rewardQuerySchema, rewardIdParamSchema } from '../schemas/reward.schema'

const router = Router()

// GET /api/rewards - Get all rewards for authenticated user
router.get('/', validateRequest({ query: rewardQuerySchema }), getRewards)

// POST /api/rewards/:id/redeem - Redeem a specific reward
router.post('/:id/redeem', validateRequest({ params: rewardIdParamSchema }), redeemReward)

// GET /api/rewards/history - Get complete reward history
router.get('/history', getRewardHistory)

export default router
