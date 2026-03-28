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
 * Performs a type-safe parse of a Zod schema against raw data.
 * Captures and formats validation errors instead of throwing an exception.
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The raw data to be parsed
 * @returns An object with either the typed data or an array of formatted errors
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
 * Recursively strips all properties with `undefined` values from an object.
 * Frequently used to clean up partial update payloads before database ingestion.
 * 
 * @param obj - The source object
 * @returns A new object with no undefined fields
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}
