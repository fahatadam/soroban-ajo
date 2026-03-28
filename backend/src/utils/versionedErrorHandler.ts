/**
 * Version-Aware Error Handler
 * 
 * Formats errors based on the API version being used,
 * maintaining compatibility across versions while allowing
 * for version-specific error enhancements.
 */

import { Response } from 'express'
import { ApiVersion, CURRENT_VERSION } from './apiVersioning'

/**
 * Error response format for v1 (legacy, simplified)
 */
interface V1ErrorResponse {
  error: string
  status: number
}

/**
 * Enhanced error response format for v2 (current)
 */
interface V2ErrorResponse {
  success: false
  error: string
  code: string
  status: number
  requestId: string
  timestamp: string
  details?: Record<string, unknown>
}

/**
 * Union of all error response formats
 */
type VersionedErrorResponse = V1ErrorResponse | V2ErrorResponse

/**
 * Standard error object interface
 */
export interface StandardError extends Error {
  status?: number
  code?: string
  details?: Record<string, unknown>
  requestId?: string
}

/**
 * Converts error to version-appropriate format
 */
export function formatErrorForVersion(
  error: StandardError | Error,
  version: ApiVersion,
  requestId?: string
): VersionedErrorResponse {
  const statusCode = (error as StandardError).status || 500
  const errorCode = (error as StandardError).code || 'INTERNAL_ERROR'
  const errorMessage = error.message || 'An error occurred'
  const errorDetails = (error as StandardError).details

  if (version === 'v1') {
    // v1: Simple format
    return {
      error: errorMessage,
      status: statusCode,
    } as V1ErrorResponse
  }

  // v2: Enhanced format (current default)
  return {
    success: false,
    error: errorMessage,
    code: errorCode,
    status: statusCode,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    ...(errorDetails && { details: errorDetails }),
  } as V2ErrorResponse
}

/**
 * Sends version-appropriate error response
 */
export function sendVersionedError(
  res: Response,
  error: StandardError | Error,
  requestId?: string
): void {
  const version = (res.req as any)?.apiVersion || CURRENT_VERSION
  const statusCode = (error as StandardError).status || 500

  const formattedError = formatErrorForVersion(error, version, requestId)

  res.status(statusCode).json(formattedError)
}

/**
 * Creates a version-aware error handler middleware
 */
export function createVersionedErrorHandler() {
  return (err: StandardError | Error, req: any, res: Response, _next: any) => {
    const version = (req as any)?.apiVersion || CURRENT_VERSION
    const requestId = req.id || generateRequestId()
    const statusCode = (err as StandardError).status || 500

    const formattedError = formatErrorForVersion(err, version, requestId)

    res.status(statusCode).json(formattedError)
  }
}

/**
 * Generates a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Creates a standardized error with version awareness
 */
export function createStandardError(
  message: string,
  code: string,
  status: number = 500,
  details?: Record<string, unknown>
): StandardError {
  const error = new Error(message) as StandardError
  error.code = code
  error.status = status
  error.details = details
  return error
}

/**
 * Version compatibility checker for error responses
 * Ensures error responses contain only version-compatible fields
 */
export function ensureErrorCompatibility(
  error: VersionedErrorResponse,
  version: ApiVersion
): VersionedErrorResponse {
  if (version === 'v1') {
    // Only return v1-compatible fields
    const { error: errorMsg, status } = error as V2ErrorResponse
    return {
      error: errorMsg || 'An error occurred',
      status: status || 500,
    }
  }

  // v2 and later can have all fields
  return error
}

/**
 * Utility to add version-specific error metadata to responses
 */
export function enrichErrorWithVersionInfo(
  res: Response,
  error: VersionedErrorResponse,
  version: ApiVersion
): VersionedErrorResponse {
  if (version === 'v2' && 'code' in error) {
    // Add version-specific info to v2 errors
    (error as V2ErrorResponse).details = {
      ...(error as V2ErrorResponse).details,
      apiVersion: version,
      migrateToVersion: CURRENT_VERSION,
    }
  }

  return error
}

/**
 * Specific error constructors for common scenarios
 */

export function ValidationError(
  message: string,
  field?: string,
  value?: unknown
): StandardError {
  return createStandardError(message, 'VALIDATION_ERROR', 400, {
    ...(field && { field }),
    ...(value !== undefined && { value }),
  })
}

export function AuthenticationError(message: string = 'Authentication required'): StandardError {
  return createStandardError(message, 'AUTHENTICATION_ERROR', 401)
}

export function AuthorizationError(message: string = 'Not authorized to access this resource'): StandardError {
  return createStandardError(message, 'AUTHORIZATION_ERROR', 403)
}

export function NotFoundError(resource: string, id?: string): StandardError {
  const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
  return createStandardError(message, 'NOT_FOUND', 404, {
    resource,
    ...(id && { id }),
  })
}

export function ConflictError(message: string, details?: Record<string, unknown>): StandardError {
  return createStandardError(message, 'CONFLICT', 409, details)
}

export function RateLimitError(retryAfter?: number): StandardError {
  return createStandardError(
    'Too many requests. Please try again later.',
    'RATE_LIMIT_EXCEEDED',
    429,
    {
      ...(retryAfter && { retryAfter }),
    }
  )
}

export function InternalServerError(message: string = 'Internal server error'): StandardError {
  return createStandardError(message, 'INTERNAL_ERROR', 500)
}

export function BadGatewayError(message: string = 'Bad gateway'): StandardError {
  return createStandardError(message, 'BAD_GATEWAY', 502)
}

export function ServiceUnavailableError(message: string = 'Service unavailable'): StandardError {
  return createStandardError(message, 'SERVICE_UNAVAILABLE', 503)
}

/**
 * Example usage in route handlers:
 *
 * ```typescript
 * import { sendVersionedError, ValidationError } from '../utils/versionedErrorHandler'
 *
 * router.post('/resource', async (req, res) => {
 *   try {
 *     if (!req.body.name) {
 *       return sendVersionedError(res, ValidationError('Name is required', 'name'))
 *     }
 *
 *     // Process request...
 *     res.json({ success: true })
 *   } catch (error) {
 *     sendVersionedError(res, error as Error)
 *   }
 * })
 * ```
 */
