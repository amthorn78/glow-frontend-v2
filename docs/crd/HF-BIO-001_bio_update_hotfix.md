# HF-BIO-001: Bio Update Hotfix - Frontend Error Handling + Proxy Configuration

**Priority:** P0 Hotfix  
**Type:** Bug Fix (Frontend + Infrastructure)  
**Size:** 28 LOC (20 FE + 8 Infra)  
**Rollback:** Single commit revert  

## Problem Statement

Bio updates in the UI show "Profile updated successfully!" but revert to old values on page refresh within the same session. Updated bio only appears after logout/login cycle.

**Root Cause:** Frontend treats proxy-level 400 responses as success due to JSON parsing errors, triggering cache invalidation while the backend update never occurred.

## Solution Architecture

### HF-BIO-001C: Frontend Mutation Error Handling
**Goal:** Never show success or invalidate cache if mutation failed (non-2xx), even with plain text responses.

**Changes:**
- Wrap `response.json()` in try/catch to handle plain text responses
- Create structured error object for non-JSON responses
- Maintain existing `response.ok` gating in ProfilePage

### HF-BIO-001D: Proxy Configuration Fix  
**Goal:** Ensure PUT requests to `/api/profile/*` reach Flask and return typed JSON responses.

**Changes:**
- Add explicit HTTP method matching in Vercel rewrites
- Include CORS headers for PUT methods and CSRF tokens
- Preserve existing security headers

## Technical Implementation

### File 1: `src/utils/csrfMutations.ts`

**Before:**
```typescript
let response = await fetch(path, requestOptions);
let data = await response.json(); // Throws on plain text
```

**After:**
```typescript
let response = await fetch(path, requestOptions);
let data;

// HF-BIO-001C: Safely parse JSON, handle plain text responses
try {
  data = await response.json();
} catch (jsonError) {
  // Handle plain text responses (e.g., proxy 400s)
  const bodyText = await response.text();
  data = {
    code: 'HTTP_ERROR',
    error: `HTTP ${response.status}`,
    status: response.status,
    bodyText: bodyText
  };
}
```

**Applied to both:**
- Initial request (line 183-199)
- CSRF retry request (line 226-240)

### File 2: `vercel.json`

**Before:**
```json
{
  "source": "/api/(.*)",
  "destination": "https://glow-backend-v4-production.up.railway.app/api/$1"
}
```

**After:**
```json
{
  "source": "/api/(.*)",
  "destination": "https://glow-backend-v4-production.up.railway.app/api/$1",
  "has": [
    {
      "type": "method",
      "value": "(GET|POST|PUT|PATCH|DELETE|OPTIONS)"
    }
  ]
}
```

**Headers Added:**
```json
{
  "key": "Access-Control-Allow-Methods",
  "value": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
},
{
  "key": "Access-Control-Allow-Headers", 
  "value": "Content-Type, X-CSRF-Token, Authorization, Cookie"
}
```

## Acceptance Criteria

### HF-BIO-001C (Frontend)
- [ ] **400 Response Handling:** Plain text 400 → error toast, no success message, no cache invalidation
- [ ] **Success Path:** 200 → invalidate `['auth','me']` and UI shows new bio after refresh
- [ ] **Error Display:** User sees meaningful error message for failed updates
- [ ] **No False Success:** Never show "Profile updated successfully!" on 4xx responses

### HF-BIO-001D (Infrastructure)  
- [ ] **Typed JSON Responses:** `curl` via glowme.io returns JSON (200/400/403), not plain text 400
- [ ] **Method Support:** PUT requests reach Flask application
- [ ] **Header Preservation:** CSRF tokens and content-type properly forwarded
- [ ] **Cache Headers:** Responses include `Cache-Control: no-store`

## Testing Protocol

### Pre-Deployment Testing
```bash
# Test frontend error handling with mock 400
# (Unit test or browser dev tools network override)

# Test proxy configuration
HOST="www.glowme.io"
COOKIES="/tmp/test_cookies.jar"

# Login and get CSRF
curl -sS -c "$COOKIES" -b "$COOKIES" -H "Content-Type: application/json" \
  -X POST "https://$HOST/api/auth/login" \
  -d '{"email":"admin@glow.app","password":"admin123"}'

curl -sS -c "$COOKIES" -b "$COOKIES" "https://$HOST/api/auth/csrf"
CSRF=$(awk 'tolower($0) ~ /glow_csrf/ {print $7}' "$COOKIES")

# Test PUT request - should return typed JSON, not plain text 400
curl -isS -c "$COOKIES" -b "$COOKIES" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -X PUT "https://$HOST/api/profile/basic-info" \
  -d '{"bio":"test_update"}'
```

**Pass Criteria:**
- Response is JSON format (200 success or 400/403 with error details)
- Headers include `Cache-Control: no-store`
- No plain text "400 Bad Request" responses

### Post-Deployment Verification
1. **Bio Update Flow:**
   - Edit bio in UI → Click Save
   - Verify success/error message matches actual result
   - Refresh page → Bio should persist if save succeeded
   - No cache invalidation on failures

2. **Error Scenarios:**
   - Invalid CSRF → Proper error message, no false success
   - Network failure → Proper error message, no cache corruption
   - Validation errors → Field-specific error display

## Rollback Plan

**Single Commit Revert:**
```bash
git revert <commit-hash>
```

**Immediate Rollback Triggers:**
- Plain text 400 responses still occurring
- False success messages on failures  
- Cache invalidation on error responses
- CSRF token forwarding broken

**Rollback Verification:**
- Bio updates show proper error messages on failure
- No "success" messages when backend returns 400
- Cache only invalidated on actual success (2xx responses)

## Security Considerations

**Maintained:**
- `Cache-Control: no-store` on auth/profile endpoints
- CSRF token validation requirements
- Cookie-based session authentication
- `X-Content-Type-Options: nosniff`

**Enhanced:**
- Explicit CORS method allowlist
- Proper header forwarding for security tokens
- Structured error responses (no information leakage)

## Performance Impact

**Minimal:**
- Additional try/catch adds ~1ms per request
- Vercel proxy configuration has no runtime cost
- No additional network requests
- Cache invalidation behavior unchanged for success cases

## Dependencies

**Frontend:**
- React Query cache invalidation logic (unchanged)
- CSRF token refresh mechanism (unchanged)
- ProfilePage error handling (unchanged)

**Infrastructure:**
- Vercel proxy service (configuration change only)
- Railway backend service (no changes)
- Redis session store (no changes)

## Monitoring

**Success Metrics:**
- Reduction in false "success" messages
- Increase in proper error message display
- Decrease in user confusion about bio updates

**Error Metrics:**
- Monitor for JSON parsing errors in browser console
- Track 400 response rates to profile endpoints
- Watch for CSRF token forwarding issues

**Alerts:**
- Spike in plain text 400 responses
- Increase in cache invalidation without successful updates
- CSRF auto-recovery failures

---

**Implementation Status:** Ready for Commit  
**Estimated Deployment Time:** 5 minutes (Vercel auto-deploy)  
**Risk Level:** Low (isolated error handling + config change)  
**Reviewer:** Nathan Amthor  
**TBCACT Phase:** Code Review → Ask → Commit → Test
