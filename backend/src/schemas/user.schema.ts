import { z } from 'zod'
import { stellarPublicKeySchema } from './common.schema'

export const updateUserProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name cannot be empty')
    .max(100, 'Display name must be 100 characters or less')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
})

export const walletAddressParamSchema = z.object({
  walletAddress: stellarPublicKeySchema,
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
export type WalletAddressParam = z.infer<typeof walletAddressParamSchema>
