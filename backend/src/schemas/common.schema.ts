import { z } from 'zod'

/** Stellar public key: 56 chars, starts with G */
export const stellarPublicKeySchema = z
  .string()
  .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar public key format')

/** UUID path param */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

/** Generic string ID param (for non-UUID IDs) */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

/** Pagination query params */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
})

/** Offset-based pagination */
export const offsetPaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  offset: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
})

export type PaginationQuery = z.infer<typeof paginationSchema>
export type OffsetPaginationQuery = z.infer<typeof offsetPaginationSchema>
export type IdParam = z.infer<typeof idParamSchema>
