import { z } from 'zod'
import { stellarPublicKeySchema, paginationSchema, idParamSchema } from './common.schema'

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  contributionAmount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Contribution amount must be a positive number',
    }),
  frequency: z.string().min(1, 'Frequency is required'),
  maxMembers: z
    .number()
    .int('Max members must be an integer')
    .min(2, 'Max members must be at least 2')
    .max(100, 'Max members cannot exceed 100'),
  currentMembers: z
    .number()
    .int('Current members must be an integer')
    .min(0, 'Current members cannot be negative')
    .max(100, 'Current members cannot exceed 100'),
  adminPublicKey: stellarPublicKeySchema,
})

export const joinGroupSchema = z.object({
  publicKey: stellarPublicKeySchema,
  signedXdr: z.string().optional(),
})

export const contributeSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  publicKey: stellarPublicKeySchema,
  signedXdr: z.string().optional(),
})

export const groupIdParamSchema = idParamSchema

export const groupPaginationQuerySchema = paginationSchema

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type JoinGroupInput = z.infer<typeof joinGroupSchema>
export type ContributeInput = z.infer<typeof contributeSchema>
