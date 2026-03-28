# API Versioning Guide

## Overview

This document describes the API versioning strategy for the Ajo API. The versioning system ensures backward compatibility while allowing for API improvements and breaking changes through explicit version management.

**Current Status:**
- **Current Version:** v2 (active)
- **Supported Versions:** v1, v2
- **Legacy Version:** v1 (supported with deprecation planned)

---

## Table of Contents

1. [Versioning Strategy](#versioning-strategy)
2. [Supported API Versions](#supported-api-versions)
3. [Making Requests](#making-requests)
4. [Version Headers](#version-headers)
5. [Deprecation Policy](#deprecation-policy)
6. [Migration Guide: v1 to v2](#migration-guide-v1-to-v2)
7. [For API Consumers](#for-api-consumers)
8. [For Developers](#for-developers)

---

## Versioning Strategy

### Semantic Versioning

We use a major version system (v1, v2, etc.) for API versions. Each version represents a significant evolution of the API.

- **Major Version (v1, v2, etc.):** Indicates breaking changes or significant new features
- **Within-version improvements:** Non-breaking enhancements are deployed transparently

### Backward Compatibility

- **v1 endpoints** remain functional and receive critical security updates
- **v2 introduces** enhancements with some breaking changes
- The **current version (v2)** receives all new features
- **Older versions** transition to deprecation with a 90-day sunset period before removal

### Design Principles

1. **Explicit versioning:** All API endpoints are accessed via explicit version paths (`/api/v1/`, `/api/v2/`)
2. **Gradual migration:** Clients have ample time to migrate before sunset
3. **Deprecation warnings:** Clear headers signal which versions are being phased out
4. **Migration resources:** Full guides provided to help clients update their integrations

---

## Supported API Versions

### Version: v1

| Aspect | Details |
|--------|---------|
| **Status** | Supported (Legacy) |
| **Release Date** | 2024-01-01 |
| **Sunset Date** | TBD (90+ days notice will be provided) |
| **URL Base** | `/api/v1/` |
| **Key Features** | Core API functionality |
| **Support Level** | Security updates only |

### Version: v2

| Aspect | Details |
|--------|---------|
| **Status** | Active (Current) |
| **Release Date** | 2026-04-01 |
| **Sunset Date** | None (current active version) |
| **URL Base** | `/api/v2/` |
| **Key Features** | Enhanced pagination, improved errors, additional metadata |
| **Support Level** | Full support |

#### v2 Breaking Changes

The following endpoints have breaking changes in v2:

1. **Response Pagination Format**
   - **v1:** Page-based pagination (`page`, `limit`, `total`)
   - **v2:** Cursor-based pagination (`cursor`, `limit`, `hasMore`)

2. **Error Response Structure**
   - **v1:** Simple error format
   - **v2:** Enhanced format with error codes, details, and request ID

3. **Removed Endpoints**
   - Any deprecated v1-only endpoints are removed in v2

---

## Making Requests

### Request Format

All versioned API requests use this format:

```
https://api.ajo.io/api/v{VERSION}/{RESOURCE}
```

### Examples

#### Using v2 (Current)

```bash
# Get groups
curl -X GET https://api.ajo.io/api/v2/groups

# Create a group
curl -X POST https://api.ajo.io/api/v2/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My Group"}'
```

#### Using v1 (Legacy)

```bash
# Get groups
curl -X GET https://api.ajo.io/api/v1/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Backward Compatibility

Old paths without version are automatically redirected to v2:

```bash
# This request:
curl -X GET https://api.ajo.io/api/groups

# Is redirected (308) to:
curl -X GET https://api.ajo.io/api/v2/groups
```

---

## Version Headers

### Request Headers

```
X-API-Version: v2           # Optional - explicitly request version
Authorization: Bearer TOKEN # Required for protected endpoints
```

### Response Headers

All API responses include version information:

```
X-API-Version: v2                      # The version that handled this request
X-API-Current-Version: v2              # The latest available version
```

### Deprecation Headers (for deprecated versions)

When using a deprecated API version, additional headers appear:

```
Deprecation: true                           # Indicates this version is deprecated
Sunset: Wed, 28 Jun 2026 00:00:00 GMT     # Date when version stops working
X-API-Deprecation-Date: 2026-03-28         # When deprecation was announced
X-API-Sunset-Date: 2026-06-28              # Final sunset date
X-API-Migration-Guide: docs/...            # Link to migration guide
X-API-Breaking-Changes: true               # Indicates breaking changes exist
Link: </api/v2>; rel="successor-version"   # Link to newer version
```

---

## Deprecation Policy

### Deprecation Timeline

1. **Announcement:** Deprecation announced via headers and documentation
2. **Support Period:** 90 days of continued support after deprecation announcement
3. **Sunset:** API version stops functioning (returns 410 Gone)

### Detecting Deprecated Endpoints

Check for the `Deprecation: true` header in responses:

```javascript
if (response.headers.get('Deprecation') === 'true') {
  const sunsetDate = response.headers.get('X-API-Sunset-Date')
  console.warn(`This API version is deprecated and will stop working on ${sunsetDate}`)
}
```

### Deprecated Endpoints

Current deprecation status:

- **v1:** Supported (no sunset date announced yet, but use v2 for new integrations)

---

## Migration Guide: v1 to v2

### Overview of Changes

#### 1. Response Format Changes

**Pagination - v1 Format:**

```json
{
  "data": [
    { "id": "group_1", "name": "Group A" },
    { "id": "group_2", "name": "Group B" }
  ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "pages": 3
}
```

**Pagination - v2 Format (Cursor-Based):**

```json
{
  "data": [
    { "id": "group_1", "name": "Group A" },
    { "id": "group_2", "name": "Group B" }
  ],
  "cursor": "eyJpZCI6ICJncm91cF8yIn0=",
  "limit": 20,
  "hasMore": true,
  "total": 42
}
```

**Migration:**

```javascript
// v1 Code
const page = response.page
const totalPages = response.pages
const nextPage = page + 1

// v2 Code
const cursor = response.cursor
const hasNextPage = response.hasMore
const nextCursor = cursor // Use cursor for next request
```

#### 2. Error Response Changes

**v1 Error Format:**

```json
{
  "error": "Invalid request",
  "status": 400
}
```

**v2 Error Format:**

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "status": 400,
  "requestId": "req_abc123xyz",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  },
  "timestamp": "2026-03-28T10:00:00.000Z"
}
```

**Migration:**

```javascript
// v1 Code
if (error.status === 400) {
  console.error(error.error)
}

// v2 Code
if (error.status === 400) {
  console.error(`${error.code}: ${error.details?.message || error.error}`)
  console.log(`Request ID: ${error.requestId}`) // For debugging
}
```

#### 3. Endpoint Changes

| v1 Endpoint | v2 Endpoint | Changes |
|---|---|---|
| `GET /api/v1/groups` | `GET /api/v2/groups` | Pagination format changed |
| `GET /api/v1/rewards` | `GET /api/v2/rewards` | Pagination format changed |
| All other endpoints | Same under `/api/v2/*` | Request/response format improvements |

### Step-by-Step Migration

#### Step 1: Update Base URL

```javascript
// Before (v1)
const API_BASE = 'https://api.ajo.io/api/v1'

// After (v2)
const API_BASE = 'https://api.ajo.io/api/v2'
```

#### Step 2: Update Pagination Handling

```javascript
// Before (v1)
async function fetchGroups(pageNum = 1) {
  const response = await fetch(`${API_BASE}/groups?page=${pageNum}`)
  const data = await response.json()
  return {
    groups: data.data,
    nextPage: data.page < data.pages ? data.page + 1 : null
  }
}

// After (v2)
async function fetchGroups(cursor = null) {
  const params = cursor ? `?cursor=${cursor}` : ''
  const response = await fetch(`${API_BASE}/groups${params}`)
  const data = await response.json()
  return {
    groups: data.data,
    nextCursor: data.hasMore ? data.cursor : null
  }
}
```

#### Step 3: Update Error Handling

```javascript
// Before (v1)
try {
  const response = await fetch(url)
  const data = await response.json()
} catch (error) {
  console.error(error.error || 'Unknown error')
}

// After (v2)
try {
  const response = await fetch(url)
  const data = await response.json()
  if (!data.success) {
    console.error(`[${data.code}] ${data.error}`)
    if (data.details) {
      console.error('Details:', JSON.stringify(data.details, null, 2))
    }
  }
} catch (error) {
  console.error('Request failed:', error.message)
}
```

#### Step 4: Test Thoroughly

After updating your implementation:

1. Test all CRUD operations
2. Verify pagination works correctly
3. Check error handling behaves as expected
4. Update unit/integration tests

---

## For API Consumers

### Best Practices

1. **Pin Your API Version:** Use explicit versioning in your client to avoid sudden breaking changes
2. **Monitor Deprecation Headers:** Check for `Deprecation` headers in production responses
3. **Plan Migration Timeline:** Start migration to new versions 30+ days before sunset
4. **Use Request IDs:** Include `X-Request-ID` in your requests for debugging
5. **Test with Beta:** Test new versions in staging before deploying to production

### Recommended SDKs and Clients

- **JavaScript/TypeScript:** Use the official Ajo SDK (handles versioning automatically)
- **Python:** Use `ajo-python-client`
- **Go:** Use `ajo-go-client`

### Getting Version Information

Check available versions at any time:

```bash
curl https://api.ajo.io/api-versions -H "Authorization: Bearer YOUR_TOKEN"
```

Response:

```json
{
  "currentVersion": "v2",
  "supportedVersions": ["v1", "v2"],
  "v1": {
    "status": "supported",
    "releaseDate": "2024-01-01",
    "url": "/api/v1/"
  },
  "v2": {
    "status": "active",
    "releaseDate": "2026-04-01",
    "url": "/api/v2/",
    "features": ["Enhanced pagination", "Improved error handling"]
  }
}
```

---

## For Developers

### Adding New Endpoints

When adding new endpoints, they should be available in the current version (v2):

```typescript
// routes/v2/NewFeature.ts
import { Router } from 'express'

const router = Router()

/**
 * Create a new resource
 * @route POST /api/v2/new-feature
 * @version v2
 */
router.post('/', async (req, res) => {
  // Implementation
})

export { router }
```

### Creating Breaking Changes

If introducing breaking changes:

1. **Increment Version:** Create a new major version (v3)
2. **Create New Route:** `/routes/v3/index.ts`
3. **Document Changes:** Update this guide
4. **Announce Deprecation:** Mark v2 as deprecated in `apiVersioning.ts`
5. **Provide Migration Path:** Create migration guide

### Example: Implementing v3

```typescript
// backend/src/utils/apiVersioning.ts

export const VERSION_METADATA: Record<string, VersionMetadata> = {
  v1: { /* ... */ },
  v2: {
    status: 'deprecated',  // Mark as deprecated
    sunsetDate: new Date('2026-07-01'),
    successor: 'v3',
    /* ... */
  },
  v3: {
    version: 'v3',
    releaseDate: new Date('2026-04-15'),
    status: 'active',
    changesSummary: 'GraphQL support, better caching',
    breakingChanges: [/* ... */],
  },
}

export const CURRENT_VERSION: ApiVersion = 'v3'
```

### Testing API Versions

```typescript
// backend/tests/apiVersioning.test.ts

describe('API Versioning', () => {
  it('should support v1 endpoints', async () => {
    const res = await request(app).get('/api/v1/groups')
    expect(res.status).toBe(200)
    expect(res.headers['x-api-version']).toBe('v1')
  })

  it('should support v2 endpoints', async () => {
    const res = await request(app).get('/api/v2/groups')
    expect(res.status).toBe(200)
    expect(res.headers['x-api-version']).toBe('v2')
  })

  it('should reject unsupported versions', async () => {
    const res = await request(app).get('/api/v99/groups')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('UNSUPPORTED_API_VERSION')
  })

  it('should add deprecation headers for deprecated versions', async () => {
    // Assuming v1 becomes deprecated
    const res = await request(app).get('/api/v1/groups')
    expect(res.headers['deprecation']).toBe('true')
    expect(res.headers['sunset']).toBeDefined()
  })
})
```

---

## Status Codes

### Versioning-Related Status Codes

| Status | Code | Meaning |
|--------|------|---------|
| 200 OK | - | Successful request |
| 308 Permanent Redirect | - | Redirecting to current version |
| 400 Bad Request | `UNSUPPORTED_API_VERSION` | Requested version not supported |
| 410 Gone | - | Version has reached sunset (if implemented) |

---

## Contact & Support

For questions about API versioning:

- **Email:** support@ajo.io
- **Documentation:** https://docs.ajo.io
- **GitHub Issues:** https://github.com/christopherdominic/soroban-ajo/issues

---

## Changelog

### v2 (Current - 2026-04-01)

- Introduced cursor-based pagination
- Enhanced error response structure
- Added request ID tracking
- Improved deprecation headers
- Better version metadata

### v1 (2024-01-01)

- Initial API release with core functionality
