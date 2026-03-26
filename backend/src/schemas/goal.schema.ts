import { z } from 'zod'
import { idParamSchema } from './common.schema'

const goalCategoryEnum = z.enum([
  'EMERGENCY',
  'VACATION',
  'EDUCATION',
  'HOME',
  'RETIREMENT',
  'CUSTOM',
])

const goalStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED'])

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  targetAmount: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Target amount must be a positive number',
    }),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid deadline date' }),
  category: goalCategoryEnum,
  isPublic: z.boolean().optional().default(false),
})

export const updateGoalSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  targetAmount: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Target amount must be a positive number',
    })
    .optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid deadline date' })
    .optional(),
  category: goalCategoryEnum.optional(),
  isPublic: z.boolean().optional(),
  status: goalStatusEnum.optional(),
})

export const affordabilitySchema = z.object({
  monthlyIncome: z.number().positive('Monthly income must be positive'),
  monthlyExpenses: z.number().min(0, 'Monthly expenses cannot be negative'),
  goalTarget: z.number().positive('Goal target must be positive'),
  goalDeadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid goal deadline date' }),
})

export const projectionSchema = z.object({
  principal: z.number().min(0, 'Principal cannot be negative'),
  monthlyContribution: z.number().min(0, 'Monthly contribution cannot be negative'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100'),
  years: z.number().positive('Years must be positive').max(100, 'Years cannot exceed 100'),
})

export const goalIdParamSchema = idParamSchema

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type AffordabilityInput = z.infer<typeof affordabilitySchema>
export type ProjectionInput = z.infer<typeof projectionSchema>
