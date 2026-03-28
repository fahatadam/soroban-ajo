import swaggerUi from 'swagger-ui-express'
import { Express, Request, Response } from 'express'
import { openApiSpec } from './docs/openapi-spec'

export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { font-size: 2em; margin: 20px 0; }
        .swagger-ui .scheme-container { background: #fafafa; }
        .swagger-ui .btn { border-radius: 4px; }
        .version-banner {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 12px;
          margin: 10px 0;
          color: #444;
        }
        .version-banner .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-right: 8px;
        }
        .version-banner .badge-active {
          background: #28a745;
          color: white;
        }
        .version-banner .badge-legacy {
          background: #ffc107;
          color: #333;
        }
      `,
      customSiteTitle: 'Ajo API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        filter: true,
        showExtensions: true,
        deepLinking: true,
      },
    })
  )

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.json(openApiSpec)
  })

  // API documentation info endpoint
  app.get('/api-docs/info', (_req: Request, res: Response) => {
    res.json({
      title: 'Ajo API Documentation',
      version: '2.0.0',
      description: 'Decentralized Savings Groups API',
      currentApiVersion: 'v2',
      supportedVersions: ['v1', 'v2'],
      endpoints: {
        interactive: '/api-docs',
        openapi: '/api-docs.json',
        versioning: '/api-versions',
      },
      apiBases: {
        v1: '/api/v1',
        v2: '/api/v2',
      },
      resources: {
        github: 'https://github.com/Christopherdominic/soroban-ajo',
        versioningGuide: '/docs/API_VERSIONING_GUIDE.md',
        support: 'support@ajo.app',
      },
      versioning: {
        strategy: 'Major version in URL path (/api/v1/, /api/v2/)',
        current: 'v2',
        deprecated: [],
        sunsetPolicy: '90 days notice before removing deprecated versions',
        breakingChangesV2: [
          'Response pagination format changed from page-based to cursor-based',
          'Error response structure improved with additional context',
          'Some deprecated endpoints removed',
        ],
      },
    })
  })

  // Swagger UI redirect for versioning section
  app.get('/api-docs/versioning', (_req: Request, res: Response) => {
    res.json({
      message: 'API Versioning Information',
      current_version: 'v2',
      supported_versions: ['v1', 'v2'],
      v1: {
        status: 'supported',
        base_url: '/api/v1',
        release_date: '2024-01-01',
        sunset_date: null,
        description: 'Initial API version with core features',
      },
      v2: {
        status: 'active',
        base_url: '/api/v2',
        release_date: '2026-04-01',
        sunset_date: null,
        description: 'Current version with enhanced features',
        breaking_changes: [
          'Pagination now uses cursor-based format instead of page-based',
          'Error responses have enhanced structure with error codes',
          'All responses include request ID for tracking',
        ],
      },
      migration_guide: '/docs/API_VERSIONING_GUIDE.md',
      endpoints: {
        v1_backwards_compat: {
          status: 'active',
          description: 'Requests to /api/resource are redirected to /api/v2/resource',
          redirect_type: '308 Permanent Redirect',
        },
        version_info: {
          url: '/api-versions',
          description: 'Get information about all available API versions',
        },
      },
    })
  })
}
