import { Request, Response, NextFunction } from 'express'
import {
  SUPPORTED_VERSIONS,
  ApiVersion,
  CURRENT_VERSION,
  extractVersionFromPath,
  isVersionSupported,
  isVersionDeprecated,
  attachDeprecationHeaders,
  getVersionMetadata,
} from '../utils/apiVersioning'

// Re-export for backward compatibility
export { SUPPORTED_VERSIONS, ApiVersion, CURRENT_VERSION }

/**
 * Attaches API version headers to every response and validates the version
 * extracted from the URL path (e.g. /api/v1/...).
 *
 * This middleware:
 * 1. Extracts the requested API version from the path
 * 2. Validates it against supported versions
 * 3. Attaches version headers to the response
 * 4. Adds deprecation headers for deprecated versions with migration info
 */
export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract version from path like /api/v1/...
  const requestedVersion = extractVersionFromPath(req.path) || CURRENT_VERSION

  if (!isVersionSupported(requestedVersion)) {
    res.status(400).json({
      success: false,
      error: `Unsupported API version: ${requestedVersion}`,
      code: 'UNSUPPORTED_API_VERSION',
      supportedVersions: [...SUPPORTED_VERSIONS],
      currentVersion: CURRENT_VERSION,
      details: {
        message: `The requested API version is not supported. Please upgrade to ${CURRENT_VERSION}.`,
        availableVersions: [...SUPPORTED_VERSIONS],
      },
    })
    return
  }

  // Attach to response and request for use in handlers
  res.setHeader('X-API-Version', requestedVersion)
  res.setHeader('X-API-Current-Version', CURRENT_VERSION)
  ;(req as any).apiVersion = requestedVersion

  // Add deprecation headers if the version is deprecated
  if (isVersionDeprecated(requestedVersion)) {
    attachDeprecationHeaders(res, requestedVersion)

    // Log deprecation for monitoring
    const metadata = getVersionMetadata(requestedVersion)
    console.warn(
      `[API Versioning] Client using deprecated version ${requestedVersion}. ` +
        `Status: ${metadata.status}. Successor: ${metadata.successor || CURRENT_VERSION}`
    )
  }

  next()
}

/**
 * Type-safe method to get API version from request
 */
export function getRequestApiVersion(req: Request): ApiVersion {
  return (req as any).apiVersion || CURRENT_VERSION
}
