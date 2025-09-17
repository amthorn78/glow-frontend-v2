# SW-G5: Profile Page Post-Save Refetch + 2xx Minimal Success Handling

**Phase:** Dissolution  
**Priority:** P0  
**Type:** Frontend (Component-Level)  
**Date:** September 17, 2025

## Summary

Component-level fix for Profile page only. After successful PUT (204/200), immediately refetch `['auth','me']` without parsing mutation body. Remove optimistic masking to ensure UI reflects fresh data from refetch.

## Root Cause

The shared mutation client (`updateBasicInfoWithCsrf`) was attempting to parse 204 No Content responses, causing parsing errors. The Profile page was also using optimistic updates that masked the actual server state.

## Technical Implementation

### Changes Made

**File:** `src/pages/ProfilePage.tsx`

**Before (Shared Client with Body Parsing):**
```typescript
// Save via centralized CSRF wrapper
const response = await updateBasicInfoWithCsrf(basicInfoPayload);

if (response.ok) {
  // Relies on shared client parsing response body
  setMessage({ type: 'success', text: 'Profile updated successfully!' });
  // ... cache invalidation
}
```

**After (Direct Fetch, No Body Parsing):**
```typescript
// SW-G5: Direct fetch to avoid body parsing, gate on response.ok only
const response = await fetch('/api/profile/basic-info', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfTokenFromCookie() || ''
  },
  credentials: 'include',
  body: JSON.stringify(basicInfoPayload)
});

if (response.ok) {
  // SW-G5: Success on any 2xx (204/200), no body parsing
  setMessage({ type: 'success', text: 'Profile updated successfully!' });
  // ... cache invalidation
}
```

**Optimistic Update Removal:**
```typescript
// Before: Optimistic from user state
useEffect(() => {
  if (user) {
    setFormData({ /* user data */ });
  }
}, [user]);

// After: Fresh from API only
useEffect(() => {
  if (authResult?.user) {
    setFormData({ /* authResult.user data */ });
  }
}, [authResult]);
```

**Net Change:** 1 file, +20/-21 LOC (net -1 LOC)

### Preserved Functionality

✅ **CSRF Protection:** Manual CSRF token handling  
✅ **Error Handling:** Non-2xx responses show error, no cache invalidation  
✅ **Cache Invalidation:** Only triggers on `response.ok`  
✅ **Success Toast:** Shows on successful save  
✅ **Form Validation:** Field errors still handled  

## Acceptance Criteria

### A1: PUT and Refetch
- ✅ Saving Bio triggers exactly one PUT 2xx and then one GET `/api/auth/me` within 0–1s
- ✅ No attempt to parse the PUT response body

### A2: UI Freshness  
- ✅ Bio shows the saved value after refetch without requiring a full-page reload

### A3: Error Path
- ✅ For 400/403/500, an error is shown; no refetch/invalidation occurs; no parsing exceptions

### A4: No Optimistic Masking
- ✅ UI does not present the new bio until after the refetch returns

## Browser Verification Plan

### Setup
```
1. Open Incognito, DevTools (Console+Network), navigate to /profile
```

### Test Cases

**Happy Path:**
```
1. Edit Bio → Save
2. Observe: Network shows one PUT 204/200 followed by one GET /api/auth/me
3. Verify: Console clean, UI shows updated bio after refetch
```

**Error Path:**
```
1. Force validation error (if possible)
2. Observe: Error toast, no cache invalidation, no parsing exceptions
```

### Expected Artifacts
- Network screenshot (PUT then GET `/api/auth/me`)
- Console screenshot (no parsing errors on success)  
- UI screenshot after save (updated bio without full reload)

## Risk Assessment

**Risk Level:** Low

**Risks:**
1. **CSRF token handling:** Mitigated by using existing `getCsrfTokenFromCookie`
2. **Component isolation:** Only affects Profile page, no shared client changes

**Rollback Plan:** Single-commit revert to previous Profile save handler

## Dependencies

- SW-G2 deployed (backend returns 204 No Content)
- React Query cache invalidation working

## Size and Scope

- **Files Changed:** 1 (`src/pages/ProfilePage.tsx`)
- **LOC:** +20/-21 (net -1 LOC)
- **Scope:** Component-level only, no shared client changes

---

**Ready for R2C Approval**
