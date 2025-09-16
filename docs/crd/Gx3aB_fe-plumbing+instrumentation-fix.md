# CRD: Gx3aB_fe-plumbing+instrumentation-fix

**Gate**: Gx3aB_fe-plumbing+instrumentation-fix  
**Objective**: Fix frontend error handling to surface backend typed field errors and add runtime-gated instrumentation  
**Files**: ≤3 files, ≤120 LOC total  

## Problem Statement

Backend correctly returns typed 400 with `{"details":{"birth_time":["must match HH:mm (24h)"]},"error":"validation_error"}` but frontend shows generic error and no inline field validation. Need to fix error handling pipeline to surface typed errors and add runtime-gated instrumentation.

## Root Cause Analysis

**Current Implementation Issues**:
1. **Mutation wrapper throws on 4xx** - component never sees `response.details` for inline surfacing
2. **Field errors not wired** - `setFieldErrors(details)` not called when 400 with validation details
3. **Debug flag incorrect** - `NODE_ENV==='development'` won't work on production site (glowme.io)
4. **Missing instrumentation** - need runtime-gated breadcrumbs to debug live issues

## Proposed Changes

### 1. Add Runtime Debug Helper (csrfMutations.ts)

**File**: `src/utils/csrfMutations.ts`  
**Lines**: ~5 LOC  

```diff
@@ -1,6 +1,11 @@
 import { getCsrfToken } from './csrf';
 
+// Runtime debug flag helper (default OFF)
+const debugKeysOnly = (): boolean => {
+  return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === 'true');
+};
+
 interface MutationResponse<T = any> {
   ok: boolean;
   status: number;
```

### 2. Fix Non-Throwing 4xx Response (csrfMutations.ts)

**File**: `src/utils/csrfMutations.ts`  
**Lines**: ~25 LOC  

```diff
@@ -170,15 +175,35 @@ export async function mutateWithCsrf<T = any>(
     
     const data = await response.json();
     
-    if (!response.ok) {
-      throw new Error(data.error || 'Request failed');
+    // Runtime-gated request logging (keys-only)
+    if (debugKeysOnly()) {
+      console.info('bd_req_keys', { route: path, keys: Object.keys(body || {}) });
     }
 
+    // For 4xx errors, return structured response instead of throwing
+    if (!response.ok) {
+      const errorResponse = {
+        ok: false,
+        status: response.status,
+        error: data.error || 'Request failed',
+        details: data.details || undefined
+      };
+      
+      // Runtime-gated response metadata (keys-only)
+      if (debugKeysOnly()) {
+        // Check if time matches HH:mm format (boolean only, no values)
+        const timeValue = body?.time || '';
+        const matches_hhmm = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(String(timeValue));
+        
+        console.info('bd_resp_meta', { 
+          route: path, 
+          ok: false, 
+          status: response.status, 
+          has_details: !!data.details,
+          matches_hhmm 
+        });
+      }
+      
+      return errorResponse;
+    }
+
     // Return structured response
     return {
       ok: response.ok,
```

### 3. Add Field Error Wiring (ProfileBirthDataSection.tsx)

**File**: `src/components/ProfileBirthDataSection.tsx`  
**Lines**: ~15 LOC  

```diff
@@ -1,4 +1,4 @@
-import React, { useState } from 'react';
+import React, { useState, useEffect } from 'react';
 import { useUserBirthData } from '../queries/auth/authQueries';
 import { updateBirthDataWithCsrf } from '../utils/csrfMutations';
 import BirthDataForm from './BirthDataForm';
@@ -19,6 +19,17 @@ const ProfileBirthDataSection: React.FC = () => {
   const [generalError, setGeneralError] = useState<string>('');
   const { data: birthData, isLoading } = useUserBirthData();
 
+  // Runtime debug flag helper
+  const debugKeysOnly = (): boolean => {
+    return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === 'true');
+  };
+
+  // Component mount sentinel (runtime-gated)
+  useEffect(() => {
+    if (debugKeysOnly()) {
+      console.info('bd_component_mount', { file: 'ProfileBirthDataSection.tsx', route: 'PUT /api/profile/birth-data' });
+    }
+  }, []);
+
   // Convert form data to API format
   const formatBirthData = (formData: BirthDataFormData) => {
```

### 4. Fix Error Handling in Submit Handler (ProfileBirthDataSection.tsx)

**File**: `src/components/ProfileBirthDataSection.tsx`  
**Lines**: ~20 LOC  

```diff
@@ -65,19 +76,25 @@ const ProfileBirthDataSection: React.FC = () => {
       // FE-CSRF-PIPE-02: Use centralized CSRF wrapper
       const response = await updateBirthDataWithCsrf(birthDataFormatted);
       
-      if (response.ok) {
+      if (!response.ok && response.status === 400 && response.details) {
+        // Handle typed validation errors - wire to form display
+        if (debugKeysOnly()) {
+          console.info('bd_resp_err_keys', { route: 'PUT /api/profile/birth-data', keys: Object.keys(response.details) });
+        }
+        
+        // Set field-specific errors for inline display
+        setFieldErrors(response.details);
+        setGeneralError(''); // Clear general error when we have field-specific errors
+        
+        // No refetch on 4xx - keep form populated for correction
+        return;
+      } else if (response.ok) {
         // Success - clear errors and refetch
         setFieldErrors({});
         setGeneralError('');
         refetch();
       } else {
-        // Handle typed validation errors
-        if (response.error === 'validation_error' && response.details) {
-          // Keys-only diagnostic for error response
-          if (process.env.NODE_ENV === 'development') {
-            console.info('bd_resp_err_keys', { route: 'PUT /api/profile/birth-data', keys: Object.keys(response.details) });
-          }
-          
-          // Set field-specific errors
-          const errors: Record<string, string> = {};
-          Object.entries(response.details).forEach(([field, messages]) => {
-            errors[field] = Array.isArray(messages) ? messages[0] : messages;
-          });
-          setFieldErrors(errors);
-          setGeneralError('');
-        } else {
-          // Generic error fallback
-          setGeneralError(response.error || 'Failed to save birth data');
-          setFieldErrors({});
-        }
+        // Generic error fallback for non-400 errors
+        setGeneralError(response.error || 'Failed to save birth data');
+        setFieldErrors({});
       }
     } catch (error) {

## Files Touched

1. **src/utils/csrfMutations.ts** (~30 LOC)
   - Add `debugKeysOnly()` runtime helper function
   - Fix non-throwing 4xx response handling with structured return
   - Add runtime-gated bd_req_keys and bd_resp_meta logging
   - Add HH:mm regex check (boolean result only)

2. **src/components/ProfileBirthDataSection.tsx** (~35 LOC)
   - Add useEffect import
   - Add runtime debug helper function
   - Add bd_component_mount sentinel with route info
   - Fix error handling to call `setFieldErrors(response.details)` on 400
   - Add runtime-gated bd_resp_err_keys logging
   - Ensure no refetch on 4xx errors

**Total LOC**: ~65 LOC (within ≤120 limit)

## Contracts & Flags

**Runtime Debug Flag**: `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY=true` (default OFF)  
**Keys-Only Policy**: All logs use `Object.keys()` or boolean flags, no values/PII  
**Non-Throwing 4xx**: Mutation wrapper returns structured object `{ ok: false, status, error, details? }`  
**Field Error Wiring**: Call `setFieldErrors(details)` when `!ok && status===400 && details`  
**No Refetch on 4xx**: Form remains populated for user correction  
**No Payload Changes**: Request format unchanged (observe-only gate)  

## Risk & Rollback

**Risk Level**: Low  
- **Runtime-gated logging**: Default OFF, can be toggled in Vercel  
- **Non-throwing 4xx fix**: Critical for error display but isolated change  
- **Single commit revert**: Easy rollback  

## Expected Logs (Runtime-Gated)

With `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY=true`:

```javascript
// On component mount
bd_component_mount { file: 'ProfileBirthDataSection.tsx', route: 'PUT /api/profile/birth-data' }

// On save attempt with invalid time '14:25:00'
bd_req_keys { route: 'PUT /api/profile/birth-data', keys: ['date','time','timezone','location','latitude','longitude'] }
bd_resp_meta { route: 'PUT /api/profile/birth-data', ok: false, status: 400, has_details: true, matches_hhmm: false }
bd_resp_err_keys { route: 'PUT /api/profile/birth-data', keys: ['birth_time'] }
```

## CLI Test Plan

**Not applicable** - Frontend changes only, browser testing required.

## Acceptance Criteria

1. **A) Inline Error Display**: Invalid time '14:25:00' shows 'must match HH:mm (24h)' under time input field
2. **B) Console Instrumentation**: With `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY=true`, shows bd_req_keys, bd_resp_meta (ok:false, status:400, has_details:true, matches_hhmm:false), bd_resp_err_keys:['birth_time'], and bd_component_mount
3. **C) Happy Path Unchanged**: Valid time '14:25' succeeds with 2xx, no error logs
4. **D) No Refetch on 4xx**: Form remains populated for correction, no data reload
5. **E) Keys-Only Logging**: No values, IDs, emails, or PII in any console output

## Notes

**Critical Fix**: The mutation wrapper currently throws on 4xx, preventing the component from accessing `response.details`. Returning a structured object instead allows proper field error wiring.

**Runtime Debug Flag**: Using `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY` instead of `NODE_ENV` ensures logs work on production site (glowme.io) when temporarily enabled.

**Field Error Wiring**: The key fix is calling `setFieldErrors(response.details)` when we get a 400 with validation details, ensuring typed errors display inline.

**HH:mm Boolean Check**: Adds helpful diagnostic without logging actual time values, maintaining privacy while providing debugging insight.

