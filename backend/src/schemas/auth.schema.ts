import { z } from 'zod'
import { stellarPublicKeySchema } from './common.schema'

export const generateTokenSchema = z.object({
  publicKey: stellarPublicKeySchema,
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type GenerateTokenInput = z.infer<typeof generateTokenSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
