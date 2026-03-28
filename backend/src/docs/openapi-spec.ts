import { OpenAPIV3 } from 'openapi-types';
import { allSchemas } from './schemas';
import { allPaths } from './paths';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Ajo API',
    version: '1.0.0',
    description: `
# Ajo - Decentralized Savings Groups API

Backend API for Ajo, a blockchain-based savings group platform built on Stellar/Soroban.

## Overview

Ajo enables users to create and manage savings groups (ROSCAs - Rotating Savings and Credit Associations) with transparent fund distribution, on-chain transaction history, and gamified engagement.

## Key Features

- **Group Management**: Create, join, and manage savings groups
- **Contribution Tracking**: Record and verify member contributions
- **Financial Goals**: Set and track personal savings goals with affordability checks
- **Gamification**: Earn points, badges, and climb leaderboards
- **Analytics**: Track group performance and member activity
- **Webhooks**: Real-time event notifications
- **KYC Verification**: Multi-level identity verification
- **Email Notifications**: Automated reminders and updates

## Authentication

All protected endpoints require a JWT token obtained from the \`POST /api/auth/token\` endpoint.

Include the token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Tokens are valid for 7 days.

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General API**: 100 requests per 15 minutes per IP
- **Auth Endpoints**: 5 requests per hour per IP
- **Email Endpoints**: 5 requests per hour per IP

Rate limit information is included in response headers:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining in current window
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

Common error codes:
- \`VALIDATION_ERROR\` (400): Invalid request data
- \`UNAUTHORIZED\` (401): Missing or invalid token
- \`NOT_FOUND\` (404): Resource not found
- \`CONFLICT\` (409): Resource already exists or state conflict
- \`RATE_LIMIT_EXCEEDED\` (429): Too many requests

## Pagination

List endpoints support pagination with query parameters:
- \`page\`: Page number (1-indexed, default: 1)
- \`limit\`: Items per page (default: 20, max: 100)

Paginated responses include:
\`\`\`json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
\`\`\`

## API Versioning

All API endpoints are versioned under \`/api/v1/\`. Requests to the legacy \`/api/<resource>\` paths are automatically redirected (HTTP 308) to the versioned equivalent for backward compatibility.

Response headers on every API call:
- \`X-API-Version\`: The version used for this request
- \`X-API-Current-Version\`: The latest stable version

When a version is deprecated, additional headers are included:
- \`Deprecation: true\`
- \`Sunset\`: Date the version will be removed
- \`Link\`: URL of the successor version



Group creation, joining, and contributions use a two-phase process:

**Phase 1**: Client sends request → API returns unsigned XDR
**Phase 2**: Client signs XDR with wallet → Client submits signed XDR → API confirms on-chain

## Webhook Events

Subscribe to real-time events:
- \`group.created\`: New group created
- \`group.completed\`: Group completed payout
- \`member.joined\`: Member joined group
- \`contribution.made\`: Member made contribution
- \`payout.executed\`: Payout executed

## Support

- 📖 Documentation: [GitHub](https://github.com/Christopherdominic/soroban-ajo)
- 🐛 Issues: [GitHub Issues](https://github.com/Christopherdominic/soroban-ajo/issues)
- 📧 Email: support@ajo.app
    `,
    contact: {
      name: 'Ajo Team',
      email: 'support@ajo.app',
      url: 'https://github.com/Christopherdominic/soroban-ajo',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },

  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development server (v1)',
    },
    {
      url: 'https://api.ajo.app/api/v1',
      description: 'Production server (v1)',
    },
  ],

  tags: [
    {
      name: 'Health',
      description: 'Service health and status endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication and token management',
    },
    {
      name: 'KYC',
      description: 'Know Your Customer verification',
    },
    {
      name: 'Groups',
      description: 'Savings group management and operations',
    },
    {
      name: 'Goals',
      description: 'Personal savings goals management',
    },
    {
      name: 'Financial Intelligence',
      description: 'Financial analysis and projections',
    },
    {
      name: 'Analytics',
      description: 'Event tracking and analytics',
    },
    {
      name: 'Email',
      description: 'Email notification service',
    },
    {
      name: 'Webhooks',
      description: 'Webhook management and subscriptions',
    },
  ],

  paths: allPaths,

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /api/auth/token',
      },
    },

    schemas: allSchemas,

    responses: {
      UnauthorizedResponse: {
        description: 'Unauthorized - missing or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UnauthorizedError' },
          },
        },
      },

      NotFoundResponse: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotFoundError' },
          },
        },
      },

      ValidationErrorResponse: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },

      RateLimitResponse: {
        description: 'Too many requests',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RateLimitError' },
          },
        },
      },
    },

    headers: {
      'X-RateLimit-Limit': {
        description: 'Maximum requests allowed in current window',
        schema: { type: 'integer' },
      },
      'X-RateLimit-Remaining': {
        description: 'Requests remaining in current window',
        schema: { type: 'integer' },
      },
      'X-RateLimit-Reset': {
        description: 'Unix timestamp when rate limit resets',
        schema: { type: 'integer' },
      },
    },
  },

  security: [{ bearerAuth: [] }],
};
