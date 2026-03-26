import { z } from 'zod'
import { idParamSchema, offsetPaginationSchema } from './common.schema'

const rewardStatusEnum = z.enum(['PENDING', 'ACTIVE', 'REDEEMED', 'EXPIRED'])
const rewardTypeEnum = z.enum(['POINTS', 'BADGE', 'CASHBACK', 'DISCOUNT', 'BONUS'])

export const rewardQuerySchema = offsetPaginationSchema.extend({
  status: rewardStatusEnum.optional(),
  type: rewardTypeEnum.optional(),
})

export const rewardIdParamSchema = idParamSchema

export type RewardQuery = z.infer<typeof rewardQuerySchema>
export type RewardIdParam = z.infer<typeof rewardIdParamSchema>
