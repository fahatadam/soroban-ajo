import { ZodError, ZodSchema } from 'zod'

/**
 * Formats Zod validation errors into a consistent shape.
 */
export function formatZodErrors(error: ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))
}

/**
 * Safe parse that returns a typed result instead of throwing.
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ReturnType<typeof formatZodErrors> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: formatZodErrors(result.error) }
}

/**
 * Strips undefined values from an object (useful before DB updates).
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}
