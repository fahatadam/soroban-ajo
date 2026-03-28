/**
 * API Versioning Utilities
 * 
 * Manages API versions, deprecation lifecycle, and migration paths.
 * Supports multiple concurrent versions with graceful deprecation.
 */

import { Response } from 'express'

/**
 * API version metadata and lifecycle information
 */
export interface VersionMetadata {
  version: string
  releaseDate: Date
  status: 'active' | 'deprecated' | 'sunset'
  sunsetDate?: Date
  successor?: string
  changesSummary: string
  breakingChanges?: string[]
  migrationGuide?: string
}

/**
 * Version-to-metadata mapping
 */
export const VERSION_METADATA: Record<string, VersionMetadata> = {
  v1: {
    version: 'v1',
    releaseDate: new Date('2024-01-01'),
    status: 'active',
    changesSummary: 'Initial API version with core features',
    breakingChanges: [],
  },
  v2: {
    version: 'v2',
    releaseDate: new Date('2026-04-01'),
    status: 'active',
    changesSummary: 'Enhanced versioning, improved response formats, additional features',
    breakingChanges: [
      'Response pagination format changed from page-based to cursor-based',
      'Error response structure improved with additional context',
      'Some deprecated endpoints removed',
    ],
    migrationGuide:
      'See docs/API_VERSIONING_GUIDE.md for detailed migration instructions',
  },
}

/**
 * Supported API versions list
 */
export const SUPPORTED_VERSIONS = Object.keys(VERSION_METADATA) as ApiVersion[]
export type ApiVersion = keyof typeof VERSION_METADATA

/**
 * Current active API version
 */
export const CURRENT_VERSION: ApiVersion = 'v2'

/**
 * Validates if a version is supported
 */
export function isVersionSupported(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion)
}

/**
 * Gets metadata for a specific version
 */
export function getVersionMetadata(version: ApiVersion): VersionMetadata {
  return VERSION_METADATA[version]
}

/**
 * Checks if a version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  const metadata = getVersionMetadata(version)
  return metadata.status === 'deprecated' || metadata.status === 'sunset'
}

/**
 * Gets the sunset date for a deprecated version
 * If sunset date not set, calculates as 90 days from current time
 */
export function getSunsetDate(version: ApiVersion): Date {
  const metadata = getVersionMetadata(version)
  if (metadata.sunsetDate) {
    return metadata.sunsetDate
  }
  return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
}

/**
 * Attaches deprecation headers to response when using deprecated API version
 */
export function attachDeprecationHeaders(res: Response, version: ApiVersion): void {
  if (isVersionSupported(version) && isVersionDeprecated(version)) {
    const metadata = getVersionMetadata(version)
    const successor = metadata.successor || CURRENT_VERSION
    const sunsetDate = getSunsetDate(version)

    res.setHeader('Deprecation', 'true')
    res.setHeader('Sunset', sunsetDate.toUTCString())
    res.setHeader('X-API-Deprecation-Date', new Date().toISOString())
    res.setHeader('X-API-Sunset-Date', sunsetDate.toISOString())
    res.setHeader('Link', `</api/${successor}>; rel="successor-version"`)

    if (metadata.migrationGuide) {
      res.setHeader('X-API-Migration-Guide', metadata.migrationGuide)
    }

    if (metadata.breakingChanges && metadata.breakingChanges.length > 0) {
      res.setHeader('X-API-Breaking-Changes', 'true')
    }
  }
}

/**
 * Extracts API version from request path
 * Supports formats like /api/v1/... or /v1/...
 *
 * @param path - Request path
 * @returns Extracted version or null if not found
 */
export function extractVersionFromPath(path: string): ApiVersion | null {
  const match = path.match(/\/v(\d+)(\/|$)/)
  if (match) {
    const version = `v${match[1]}` as ApiVersion
    return isVersionSupported(version) ? version : null
  }
  return null
}

/**
 * Gets version-specific content for error messages or documentation
 */
export function getVersionSpecificContent(version: ApiVersion, contentType: 'breaking-changes' | 'summary') {
  const metadata = getVersionMetadata(version)
  switch (contentType) {
    case 'breaking-changes':
      return metadata.breakingChanges || []
    case 'summary':
      return metadata.changesSummary
  }
}

/**
 * Version compatibility check - determines if a client using one version
 * can safely use an endpoint designed for another version
 */
export function areVersionsCompatible(clientVersion: ApiVersion, endpointVersion: ApiVersion): boolean {
  // Same version is always compatible
  if (clientVersion === endpointVersion) return true

  // For now, only same major version is compatible
  // In the future, can be enhanced with more sophisticated compatibility logic
  const clientMajor = clientVersion.split('').find(c => /\d/.test(c))
  const endpointMajor = endpointVersion.split('').find(c => /\d/.test(c))

  return clientMajor === endpointMajor
}

/**
 * Gets all supported versions with their metadata
 */
export function getAllVersionsMetadata(): VersionMetadata[] {
  return SUPPORTED_VERSIONS.map(version => getVersionMetadata(version))
}

/**
 * Generates version information for API responses
 */
export function getVersionInfo() {
  return {
    currentVersion: CURRENT_VERSION,
    supportedVersions: SUPPORTED_VERSIONS,
    versionsMetadata: Object.entries(VERSION_METADATA).map(([version, metadata]) => ({
      version,
      status: metadata.status,
      releaseDate: metadata.releaseDate.toISOString(),
      sunsetDate: metadata.sunsetDate?.toISOString(),
      successor: metadata.successor,
      changesSummary: metadata.changesSummary,
    })),
  }
}
