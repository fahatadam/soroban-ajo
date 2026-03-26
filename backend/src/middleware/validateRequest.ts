import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError, ZodSchema } from 'zod'
import { formatZodErrors } from '../utils/zodHelpers'

type SchemaMap = {
  body?: AnyZodObject
  query?: AnyZodObject
  params?: AnyZodObject
}

/**
 * Middleware factory for validating requests using Zod schemas.
 *
 * Accepts either:
 *   - A SchemaMap: { body?, query?, params? } — validates each part independently
 *   - A single ZodSchema + source ('body' | 'query' | 'params') — legacy single-source mode
 */
export const validateRequest = (
  schema: SchemaMap | ZodSchema,
  source?: 'body' | 'query' | 'params'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (isSchemaMap(schema)) {
        if (schema.body) req.body = await schema.body.parseAsync(req.body)
        if (schema.query) req.query = await schema.query.parseAsync(req.query)
        if (schema.params) req.params = await schema.params.parseAsync(req.params)
      } else {
        const target = source ?? 'body'
        req[target] = await (schema as ZodSchema).parseAsync(req[target])
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formatZodErrors(error),
        })
        return
      }
      next(error)
    }
  }
}

function isSchemaMap(schema: SchemaMap | ZodSchema): schema is SchemaMap {
  return typeof schema === 'object' && !('parseAsync' in schema)
}

/** Alias for backward compatibility */
export const validate = validateRequest
