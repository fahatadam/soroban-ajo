/**
 * OpenAPI/Swagger Schema for API Versioning
 *
 * This file provides OpenAPI documentation for the versioning system,
 * including version information, breaking changes, and deprecation notice.
 */

// Common response schemas for different versions
export const versioningSchemas = {
  // v1 Error Response (legacy format)
  V1ErrorResponse: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'Error message',
      },
      status: {
        type: 'integer',
        description: 'HTTP status code',
      },
    },
    required: ['error', 'status'],
  },

  // v2 Error Response (enhanced format)
  V2ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        enum: [false],
        description: 'Request success indicator',
      },
      error: {
        type: 'string',
        description: 'Error message',
      },
      code: {
        type: 'string',
        description: 'Machine-readable error code',
        example: 'VALIDATION_ERROR',
      },
      status: {
        type: 'integer',
        description: 'HTTP status code',
      },
      requestId: {
        type: 'string',
        description: 'Unique request identifier for tracking',
        pattern: '^req_[a-zA-Z0-9_]+$',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'When error occurred',
      },
      details: {
        type: 'object',
        description: 'Additional error context',
        additionalProperties: true,
      },
    },
    required: ['success', 'error', 'code', 'status', 'requestId', 'timestamp'],
  },

  // Version Info Object
  VersionInfo: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        enum: ['v1', 'v2'],
        description: 'API version',
      },
      status: {
        type: 'string',
        enum: ['active', 'deprecated', 'sunset'],
        description: 'Version lifecycle status',
      },
      releaseDate: {
        type: 'string',
        format: 'date-time',
        description: 'When this version was released',
      },
      sunsetDate: {
        type: 'string',
        format: 'date-time',
        description: 'When this version will stop working (if deprecated)',
        nullable: true,
      },
      successor: {
        type: 'string',
        description: 'Recommended next version',
      },
      changesSummary: {
        type: 'string',
        description: 'Summary of changes in this version',
      },
      breakingChanges: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of breaking changes',
      },
    },
  },

  // Versions List Response
  VersionsListResponse: {
    type: 'object',
    properties: {
      currentVersion: {
        type: 'string',
        enum: ['v2'],
      },
      supportedVersions: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['v1', 'v2'],
        },
      },
      v1: { $ref: '#/components/schemas/VersionInfo' },
      v2: { $ref: '#/components/schemas/VersionInfo' },
    },
  },
}

// OpenAPI/Swagger documentation for versioning endpoints
export const versioningPaths = {
  '/api-versions': {
    get: {
      tags: ['Versioning'],
      summary: 'Get API version information',
      description: 'Returns information about supported API versions, current version, and migration paths',
      operationId: 'getVersionInfo',
      responses: {
        '200': {
          description: 'Version information retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VersionsListResponse',
              },
              example: {
                currentVersion: 'v2',
                supportedVersions: ['v1', 'v2'],
                v1: {
                  version: 'v1',
                  status: 'supported',
                  releaseDate: '2024-01-01T00:00:00Z',
                  sunsetDate: null,
                  changesSummary: 'Initial API version with core features',
                  breakingChanges: [],
                },
                v2: {
                  version: 'v2',
                  status: 'active',
                  releaseDate: '2026-04-01T00:00:00Z',
                  successor: 'v3',
                  changesSummary: 'Enhanced versioning, improved response formats',
                  breakingChanges: [
                    'Response pagination format changed from page-based to cursor-based',
                    'Error response structure improved',
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
}

// Response headers for versioning
export const versioningHeaders = {
  XApiVersion: {
    description: 'The API version that processed this request',
    schema: {
      type: 'string',
      enum: ['v1', 'v2'],
    },
  },
  XApiCurrentVersion: {
    description: 'The current active API version',
    schema: {
      type: 'string',
      enum: ['v2'],
    },
  },
  Deprecation: {
    description: 'Indicates if the requested version is deprecated',
    schema: {
      type: 'string',
      enum: ['true'],
    },
  },
  Sunset: {
    description: 'RFC 8594 Sunset header: Date when the API version will stop functioning',
    schema: {
      type: 'string',
      format: 'date',
    },
  },
  XApiDeprecationDate: {
    description: 'ISO 8601 timestamp when the version was marked as deprecated',
    schema: {
      type: 'string',
      format: 'date-time',
    },
  },
  XApiSunsetDate: {
    description: 'ISO 8601 timestamp when the version will stop functioning',
    schema: {
      type: 'string',
      format: 'date-time',
    },
  },
  XApiMigrationGuide: {
    description: 'Link to migration guide from deprecated version',
    schema: {
      type: 'string',
      format: 'uri',
    },
  },
  XApiBreakingChanges: {
    description: 'Indicates if the version has breaking changes',
    schema: {
      type: 'string',
      enum: ['true'],
    },
  },
}

// Component for versioning in OpenAPI spec
export const versioningComponentsInfo = {
  description: 'API Versioning',
  externalDocs: {
    description: 'API Versioning Guide',
    url: '/docs/API_VERSIONING_GUIDE.md',
  },
  info: {
    title: 'Ajo API Versioning',
    description:
      'The Ajo API uses semantic versioning with major version numbers in the URL path. ' +
      'Currently supporting v1 (legacy) and v2 (active). ' +
      'All new clients should use v2. See /api-versions for current version status.',
    version: '2.0.0',
  },
  servers: [
    {
      url: '{scheme}://{host}/api/v2',
      description: 'Current API version (v2)',
      variables: {
        scheme: {
          enum: ['http', 'https'],
          default: 'https',
        },
        host: {
          default: 'api.ajo.io',
          description: 'API host',
        },
      },
    },
    {
      url: '{scheme}://{host}/api/v1',
      description: 'Legacy API version (v1) - use v2 for new integrations',
      variables: {
        scheme: {
          enum: ['http', 'https'],
          default: 'https',
        },
        host: {
          default: 'api.ajo.io',
          description: 'API host',
        },
      },
    },
  ],
}

/**
 * Format deprecation notice for API documentation
 */
export function formatDeprecationNotice(version: string, sunsetDate?: Date): string {
  if (!sunsetDate) {
    return `⚠️ **Note:** Version ${version} is deprecated and will be sunset in 90 days. ` +
           `Please migrate to a newer version.`
  }

  const dateStr = sunsetDate.toLocaleDateString()
  return `🚨 **DEPRECATED:** Version ${version} will stop functioning on ${dateStr}. ` +
         `See /api-versions for migration information.`
}

/**
 * Add versioning information to endpoint documentation
 */
export function addVersioningToEndpoint(
  endpoint: any,
  availableInVersions: string[] = ['v1', 'v2'],
  breakingChanges?: string[]
): any {
  return {
    ...endpoint,
    'x-api-versions': availableInVersions,
    ...(breakingChanges && breakingChanges.length > 0 && {
      'x-breaking-changes': breakingChanges,
    }),
  }
}
