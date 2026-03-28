# API Versioning: Quick Start Migration Guide

This guide helps you migrate your API client from v1 to v2. The process is straightforward and can typically be completed in 30-60 minutes.

## Quick Overview

| Aspect | v1 | v2 |
|--------|----|----|
| **URL Base** | `/api/v1/` | `/api/v2/` |
| **Pagination** | Page-based (`page`, `limit`) | Cursor-based (`cursor`, `limit`) |
| **Errors** | Simple format | Enhanced with error codes |
| **Status** | Supported | Active (Current) |

## 5-Minute Quick Start

### 1. Update Your Base URL

```javascript
// BEFORE
const API_BASE = 'https://api.ajo.io/api/v1'

// AFTER
const API_BASE = 'https://api.ajo.io/api/v2'
```

### 2. Update Pagination (Most Important)

#### v1 Example
```javascript
// Fetch page 1
const response = await fetch(`${API_BASE}/groups?page=1&limit=20`)
const data = await response.json()
console.log(`Total pages: ${data.pages}`)
console.log(`Current page: ${data.page}`)
```

#### v2 Example
```javascript
// Fetch first page
const response = await fetch(`${API_BASE}/groups?limit=20`)
const data = await response.json()
console.log(`Has more: ${data.hasMore}`)
console.log(`Cursor for next page: ${data.cursor}`)

// Fetch next page using cursor
if (data.hasMore) {
  const nextResponse = await fetch(
    `${API_BASE}/groups?cursor=${data.cursor}&limit=20`
  )
  const nextData = await nextResponse.json()
}
```

### 3. Handle Error Changes

#### v1 Example
```javascript
try {
  const response = await fetch(url)
  const data = await response.json()
} catch (error) {
  console.error('Error:', error.error)
}
```

#### v2 Example
```javascript
try {
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok) {
    console.error(`Error [${data.code}]:`, data.error)
    console.log('Request ID:', data.requestId) // For support tickets
  }
} catch (error) {
  console.error('Error:', error.message)
}
```

## Detailed Migration Steps

### Step 1: List All Places Using the API

Search your codebase for:
```
grep -r "api/v1" .
grep -r "/api/v1" .
grep -r "api\.ajo" .
```

### Step 2: Update Each Endpoint

For each endpoint, update the base URL:

```javascript
// Change
fetch('https://api.ajo.io/api/v1/groups')

// To
fetch('https://api.ajo.io/api/v2/groups')
```

### Step 3: Update Pagination Handling

This is the most critical change. Here's a complete example:

```javascript
// OLD v1 CODE
async function getAllGroups() {
  const allGroups = []
  let currentPage = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await fetch(
      `https://api.ajo.io/api/v1/groups?page=${currentPage}&limit=20`
    )
    const data = await response.json()
    allGroups.push(...data.data)
    
    currentPage++
    hasMore = currentPage <= data.pages
  }
  
  return allGroups
}

// NEW v2 CODE
async function getAllGroups() {
  const allGroups = []
  let cursor = null
  let hasMore = true
  
  while (hasMore) {
    const params = new URLSearchParams({ limit: '20' })
    if (cursor) params.append('cursor', cursor)
    
    const response = await fetch(
      `https://api.ajo.io/api/v2/groups?${params}`
    )
    const data = await response.json()
    allGroups.push(...data.data)
    
    cursor = data.cursor
    hasMore = data.hasMore
  }
  
  return allGroups
}
```

### Step 4: Update Error Handling

```javascript
// OLD v1
function handleError(response) {
  if (response.status === 400) {
    console.error('Bad request')
  } else if (response.status === 401) {
    console.error('Unauthorized')
  }
}

// NEW v2
function handleError(error) {
  const errorCode = error.code // e.g., 'VALIDATION_ERROR', 'AUTHENTICATION_ERROR'
  const requestId = error.requestId // For debugging with support team
  
  log(`Error [${errorCode}]: ${error.error}`)
  log(`Request ID: ${requestId}`)
  
  if (error.details) {
    log('Details:', error.details)
  }
}
```

### Step 5: Testing

After making changes, test these scenarios:

```javascript
// Test 1: Simple GET
const groups = await fetch('https://api.ajo.io/api/v2/groups')

// Test 2: POST with body
const newGroup = await fetch('https://api.ajo.io/api/v2/groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Group' })
})

// Test 3: Error handling
const badRequest = await fetch('https://api.ajo.io/api/v2/groups', {
  method: 'POST',
  // Missing body intentionally to trigger error
})

// Test 4: Pagination
const page1 = await fetch('https://api.ajo.io/api/v2/groups?limit=5')
const data = await page1.json()
if (data.hasMore) {
  const page2 = await fetch(
    `https://api.ajo.io/api/v2/groups?cursor=${data.cursor}&limit=5`
  )
}
```

## SDK/Library Updates

If using an SDK, upgrade to the latest version:

### JavaScript/TypeScript
```bash
npm install ajo-sdk@latest
```

```javascript
import Ajo from 'ajo-sdk'

const client = new Ajo({
  apiKey: 'your-api-key',
  version: 'v2' // Automatically uses v2
})

// Old way - still works but will show deprecation warning
const client_v1 = new Ajo({
  apiKey: 'your-api-key',
  version: 'v1'
})
```

### Python
```bash
pip install ajo-python-client --upgrade
```

```python
from ajo import Client

client = Client(api_key='your-api-key', version='v2')
```

### Go
```bash
go get -u github.com/ajo/go-client
```

```go
import "github.com/ajo/go-client"

client := ajo.NewClient("your-api-key", "v2")
```

## Common Issues & Troubleshooting

### Issue 1: "Unsupported API version"
**Solution:** Verify your URL uses `/api/v2/` not `/api/v1/` or `/api/`

### Issue 2: "Cursor-based pagination not working"
**Error:** `"cursor": null, "hasMore": false` on first request  
**Solution:** This is correct! Omit cursor parameter on first request.

```javascript
// First request - no cursor
fetch('https://api.ajo.io/api/v2/groups?limit=20')

// Second request - include cursor from response
fetch(`https://api.ajo.io/api/v2/groups?cursor=${data.cursor}&limit=20`)
```

### Issue 3: Error structure looks different
This is expected. v2 has enhanced error information with error codes and request IDs for better debugging.

### Issue 4: Old unversioned URLs stopped working
They haven't! Requests to `/api/groups` automatically redirect to `/api/v2/groups` with a 308 status code.

## Deprecation Headers

Starting v1 deprecation, you'll see these headers in responses:

```
Deprecation: true
Sunset: Wed, 01 Jul 2026 00:00:00 GMT
X-API-Migration-Guide: https://docs.ajo.io/api-versioning
```

Check for these headers to plan your migration timeline.

## Getting Help

- **Documentation:** https://docs.ajo.io/api-versioning
- **API Status:** https://api.ajo.io/api-versions
- **Swagger UI:** https://api.ajo.io/api-docs
- **Support:** support@ajo.app

## Changelog

### v2 (Current)
- ✅ Cursor-based pagination
- ✅ Enhanced error responses
- ✅ Request ID tracking
- ✅ Better deprecation support

### v1 (Supported)
- Core API functionality
- Page-based pagination

---

**Estimated Migration Time:** 30-60 minutes
**Breaking Changes:** Pagination format only
**Backward Compatibility:** URL redirects supported
