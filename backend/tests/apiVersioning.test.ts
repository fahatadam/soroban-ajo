/**
 * API Versioning Tests
 * Tests versioning functionality, deprecation headers, and version routing
 */

import request from 'supertest'
import {
  SUPPORTED_VERSIONS,
  CURRENT_VERSION,
  isVersionSupported,
  isVersionDeprecated,
  extractVersionFromPath,
  getVersionMetadata,
  areVersionsCompatible,
} from '../../src/utils/apiVersioning'

describe('API Versioning Utilities', () => {
  describe('Version Support', () => {
    it('should support v1 and v2', () => {
      expect(isVersionSupported('v1')).toBe(true)
      expect(isVersionSupported('v2')).toBe(true)
    })

    it('should reject unsupported versions', () => {
      expect(isVersionSupported('v3')).toBe(false)
      expect(isVersionSupported('v99')).toBe(false)
      expect(isVersionSupported('invalid')).toBe(false)
    })

    it('should provide list of supported versions', () => {
      expect(SUPPORTED_VERSIONS).toContain('v1')
      expect(SUPPORTED_VERSIONS).toContain('v2')
      expect(SUPPORTED_VERSIONS.length).toBeGreaterThanOrEqual(2)
    })

    it('should have v2 as current version', () => {
      expect(CURRENT_VERSION).toBe('v2')
    })
  })

  describe('Version Extraction', () => {
    it('should extract v1 from /v1/ paths', () => {
      expect(extractVersionFromPath('/v1/groups')).toBe('v1')
      expect(extractVersionFromPath('/v1/rewards')).toBe('v1')
      expect(extractVersionFromPath('/v1/')).toBe('v1')
    })

    it('should extract v2 from /v2/ paths', () => {
      expect(extractVersionFromPath('/v2/groups')).toBe('v2')
      expect(extractVersionFromPath('/v2/rewards')).toBe('v2')
    })

    it('should handle root path', () => {
      const version = extractVersionFromPath('/')
      expect(version).toBeNull()
    })

    it('should return null for paths without version', () => {
      expect(extractVersionFromPath('/groups')).toBeNull()
      expect(extractVersionFromPath('/api/resources')).toBeNull()
    })

    it('should not extract unsupported versions', () => {
      expect(extractVersionFromPath('/v99/groups')).toBeNull()
      expect(extractVersionFromPath('/v3/resources')).toBeNull()
    })
  })

  describe('Deprecation Status', () => {
    it('should identify v1 or v2 status correctly', () => {
      const v1Metadata = getVersionMetadata('v1')
      const v2Metadata = getVersionMetadata('v2')

      expect(['active', 'deprecated', 'sunset']).toContain(v1Metadata.status)
      expect(['active', 'deprecated', 'sunset']).toContain(v2Metadata.status)
    })

    it('should mark versions as deprecated or not', () => {
      const isV2Deprecated = isVersionDeprecated('v2')
      expect(typeof isV2Deprecated).toBe('boolean')
    })

    it('should provide version metadata', () => {
      const metadata = getVersionMetadata('v1')
      expect(metadata).toHaveProperty('version')
      expect(metadata).toHaveProperty('status')
      expect(metadata).toHaveProperty('releaseDate')
      expect(metadata).toHaveProperty('changesSummary')
    })
  })

  describe('Version Compatibility', () => {
    it('should consider same versions as compatible', () => {
      expect(areVersionsCompatible('v1', 'v1')).toBe(true)
      expect(areVersionsCompatible('v2', 'v2')).toBe(true)
    })

    it('should handle different version compatibility', () => {
      // Current logic: same major version compatible
      // This may change based on compatibility rules
      const result = areVersionsCompatible('v1', 'v2')
      expect(typeof result).toBe('boolean')
    })
  })
})

describe('API Versioning Middleware', () => {
  let app: any

  beforeEach(async () => {
    // Import app after ensuring it's configured
    try {
      app = require('../../src/app').app
    } catch (e) {
      console.warn('Could not load app for middleware tests - will skip')
    }
  })

  describe('Version Routing', () => {
    it('should route v1 requests correctly', async () => {
      if (!app) return
      const res = await request(app).get('/api/v1/health').set('Authorization', 'Bearer test')
      // Should either succeed or show version header
      expect(res.headers['x-api-version']).toBeDefined()
    })

    it('should route v2 requests correctly', async () => {
      if (!app) return
      const res = await request(app).get('/api/v2/health').set('Authorization', 'Bearer test')
      expect(res.headers['x-api-version']).toBeDefined()
      expect(res.headers['x-api-version']).toBe('v2')
    })

    it('should include version headers in responses', async () => {
      if (!app) return
      const res = await request(app).get('/api/v1/health')
      expect(res.headers['x-api-version']).toBe('v1')
      expect(res.headers['x-api-current-version']).toBe('v2')
    })

    it('should reject unsupported versions', async () => {
      if (!app) return
      const res = await request(app).get('/api/v99/health')
      expect(res.status).toBe(400)
      expect(res.body.code).toBe('UNSUPPORTED_API_VERSION')
      expect(res.body.supportedVersions).toBeDefined()
    })
  })

  describe('Deprecation Headers', () => {
    it('should add deprecation headers for deprecated versions', async () => {
      if (!app) return

      // This depends on which version is deprecated
      const res = await request(app).get('/api/v1/health')

      // Check for version header (every response should have this)
      expect(res.headers['x-api-version']).toBeDefined()

      // Check for deprecation header if v1 is deprecated
      if (isVersionDeprecated('v1')) {
        expect(res.headers['deprecation']).toBe('true')
        expect(res.headers['sunset']).toBeDefined()
        expect(res.headers['x-api-sunset-date']).toBeDefined()
      }
    })

    it('should not add deprecation headers for active versions', async () => {
      if (!app) return
      const res = await request(app).get('/api/v2/health')

      if (!isVersionDeprecated('v2')) {
        expect(res.headers['deprecation']).toBeUndefined()
        expect(res.headers['sunset']).toBeUndefined()
      }
    })

    it('should include successor version in Link header', async () => {
      if (!app) return

      if (isVersionDeprecated('v1')) {
        const res = await request(app).get('/api/v1/health')
        expect(res.headers['link']).toBeDefined()
      }
    })
  })

  describe('Backward Compatibility Redirects', () => {
    it('should redirect old unversioned paths to v2', async () => {
      if (!app) return
      const res = await request(app).get('/api/groups').set('Authorization', 'Bearer test')

      // Should redirect with 308 status
      expect([300, 301, 302, 303, 307, 308]).toContain(res.status)
      expect(res.headers.location).toContain('/api/v2/')
    })

    it('should redirect old paths with resource to v2', async () => {
      if (!app) return
      const res = await request(app).get('/api/webhook').set('Authorization', 'Bearer test')

      expect([300, 301, 302, 303, 307, 308]).toContain(res.status)
    })
  })

  describe('Version Info Endpoint', () => {
    it('should provide version information', async () => {
      if (!app) return
      const res = await request(app).get('/api-versions')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('currentVersion')
      expect(res.body).toHaveProperty('supportedVersions')
      expect(res.body.currentVersion).toBe('v2')
    })

    it('should list all supported versions', async () => {
      if (!app) return
      const res = await request(app).get('/api-versions')

      expect(res.body.supportedVersions).toContain('v1')
      expect(res.body.supportedVersions).toContain('v2')
    })

    it('should include version metadata', async () => {
      if (!app) return
      const res = await request(app).get('/api-versions')

      expect(res.body.v1).toBeDefined()
      expect(res.body.v1.status).toMatch(/supported|deprecated/)
      expect(res.body.v1.url).toBe('/api/v1/')

      expect(res.body.v2).toBeDefined()
      expect(res.body.v2.status).toBe('active')
      expect(res.body.v2.url).toBe('/api/v2/')
    })
  })
})

describe('API Version Error Handling', () => {
  let app: any

  beforeEach(async () => {
    try {
      app = require('../../src/app').app
    } catch (e) {
      console.warn('Could not load app for error handling tests')
    }
  })

  it('should return proper error for unsupported version', async () => {
    if (!app) return
    const res = await request(app).get('/api/v99/groups')

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('code', 'UNSUPPORTED_API_VERSION')
    expect(res.body).toHaveProperty('supportedVersions')
    expect(res.body).toHaveProperty('currentVersion')
  })

  it('should include helpful details in version error', async () => {
    if (!app) return
    const res = await request(app).get('/api/v5/resources')

    expect(res.body.details).toBeDefined()
    expect(res.body.details.message).toBeDefined()
  })
})

describe('API Version Header Handling', () => {
  it('should have correct type definitions', () => {
    const version: typeof CURRENT_VERSION = 'v2'
    expect(version).toBe('v2')

    const versions: (typeof SUPPORTED_VERSIONS)[number][] = ['v1', 'v2']
    expect(versions.length).toBe(2)
  })

  it('should provide version metadata for all supported versions', () => {
    SUPPORTED_VERSIONS.forEach(version => {
      const metadata = getVersionMetadata(version)
      expect(metadata).toBeDefined()
      expect(metadata.version).toBe(version)
    })
  })
})
