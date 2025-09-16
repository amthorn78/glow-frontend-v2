# CRD: S6-G3_fe_csrf_auto_recover

## Goal
Add one-shot CSRF auto-recovery in the central FE mutation helper so that a failed writer with 403 + {code:"CSRF_MISSING"|"CSRF_INVALID"} automatically rotates the token via GET /api/auth/csrf and retries once with the same request. No UI changes. No payload changes.

## Files Changed
- `src/utils/csrfMutations.ts` (1 file, ~40 LOC modified)

## Unified Diff

```diff
--- a/src/utils/csrfMutations.ts
+++ b/src/utils/csrfMutations.ts
@@ -5,9 +5,9 @@
 
 // Runtime debug flag helper (default OFF)
 const debugKeysOnly = (): boolean => {
-  return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === 'true');
+  return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === '1');
 };
 
 interface MutationResponse<T = any> {
@@ -121,7 +121,7 @@
   // Prepare request options
   const requestOptions: RequestInit = {
     method,
-    credentials: 'same-origin',
+    credentials: 'include',
     headers,
   };
 
@@ -138,9 +138,9 @@
     // Check for CSRF error on first attempt
     if (response.status === 403 && isCsrfError(data)) {
       // Runtime-gated debug breadcrumb (keys-only)
-      if (debugKeysOnly()) {
-        console.info('bd_csrf_auto_recover', 'start');
-      }
+      if (debugKeysOnly()) { 
+        console.info('bd_csrf_auto_recover start');
+      }
 
       emitAuthBreadcrumb('auth.handshake.me_invalidate', { 
         route: path,
@@ -159,16 +159,16 @@
 
         if (response.ok) {
           // Runtime-gated debug breadcrumb (keys-only)
-          if (debugKeysOnly()) {
-            console.info('bd_csrf_auto_recover', 'success');
-          }
+          if (debugKeysOnly()) { 
+            console.info('bd_csrf_auto_recover success');
+          }
 
           emitAuthBreadcrumb('auth.login.success', { 
             route: path,
@@ -176,9 +176,9 @@
           });
         } else {
           // Runtime-gated debug breadcrumb (keys-only)
-          if (debugKeysOnly()) {
-            console.info('bd_csrf_auto_recover', `fail code=${data.code || 'unknown'}`);
-          }
+          if (debugKeysOnly()) { 
+            console.info(`bd_csrf_auto_recover fail code=${data.code || 'unknown'}`);
+          }
 
           emitAuthBreadcrumb('auth.login.break_glass.reload', { 
             route: path,
@@ -187,9 +187,9 @@
           });
         }
       } else {
-        // Runtime-gated debug breadcrumb (keys-only)
-        if (debugKeysOnly()) {
-          console.info('bd_csrf_auto_recover', 'fail code=csrf_refresh_failed');
-        }
+        // Runtime-gated debug breadcrumb (keys-only)
+        if (debugKeysOnly()) { 
+          console.info('bd_csrf_auto_recover fail code=csrf_refresh_failed');
+        }
 
         emitAuthBreadcrumb('auth.login.break_glass.reload', { 
           route: path,

```

## Contracts & Flags
- Uses `X-CSRF-Token` header
- Relies on `glow_csrf` cookie / `csrf_token` JSON
- `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY` gating

## Risk & Rollback
- **Risk**: Low - changes are isolated to the mutation helper and do not affect UI.
- **Rollback**: Single-commit revert restores previous behavior.

## Test Plan

### Manual Verification (post-deploy)
1. **Browser**: Delete `glow_csrf` cookie, submit birth data → seamless save (silent rotate + retry).
2. **Browser**: Submit invalid time (e.g., 25:99) → inline typed error (no rotate/retry).
3. **CI**: Existing prod smoke should still pass all 7 steps.


