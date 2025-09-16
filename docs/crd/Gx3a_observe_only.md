# Gx3a_observe_only — FE Typed Errors + Keys-Only Diagnostics

## Objective

Add typed error display for birth data validation errors and keys-only console diagnostics without changing the outbound payload. This allows observation of exact request/response shapes before implementing any time conversion logic.

## Files Touched

### src/components/ProfileBirthDataSection.tsx
- **Lines modified**: ~25 LOC
- **Changes**: Add typed error handling and keys-only diagnostics to handleSubmit

### src/utils/csrfMutations.ts  
- **Lines modified**: ~15 LOC
- **Changes**: Add typed error details pass-through in mutateWithCsrf response

**Total**: ~40 LOC across 2 files

## Proposed Changes (Unified Diffs)

### src/components/ProfileBirthDataSection.tsx - Add Error Display & Diagnostics

```diff
@@ -1,6 +1,7 @@
 import React, { useState } from 'react';
 import { useUserBirthData } from '../queries/auth/authQueries';
 import { updateBirthDataWithCsrf } from '../utils/csrfMutations';
 import BirthDataForm from './BirthDataForm';
+import { Alert, AlertDescription } from '@/components/ui/alert';

 interface BirthDataFormData {
   day: string;
@@ -17,6 +18,8 @@ interface BirthDataFormData {
 
 const ProfileBirthDataSection: React.FC = () => {
   const [isEditing, setIsEditing] = useState(false);
+  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
+  const [generalError, setGeneralError] = useState<string>('');
   const { data: birthData, isLoading } = useUserBirthData();

   // Convert form data to API format
@@ -45,6 +48,12 @@ const ProfileBirthDataSection: React.FC = () => {
   const handleSubmit = async (formData: BirthDataFormData) => {
     try {
       const birthDataFormatted = formatBirthData(formData);
+      
+      // Clear previous errors
+      setFieldErrors({});
+      setGeneralError('');
+      
+      // Keys-only diagnostic before request
+      console.info('bd_req_keys', { route: 'PUT /api/profile/birth-data', keys: Object.keys(birthDataFormatted) });
       
       console.log('save.birth.put.sent', { 
         path: '/api/profile/birth-data', 
@@ -56,11 +65,25 @@ const ProfileBirthDataSection: React.FC = () => {
       
       if (response.ok) {
         console.log('save.birth.put.200', { success: true });
-        // Exit edit mode
+        // Clear errors and exit edit mode
+        setFieldErrors({});
+        setGeneralError('');
         setIsEditing(false);
       } else {
-        console.error('save.birth.put.error', response);
-        throw new Error(response.error || 'Failed to save birth data');
+        // Handle typed validation errors
+        if (response.error === 'validation_error' && response.details) {
+          // Keys-only diagnostic for error response
+          console.info('bd_resp_err_keys', { route: 'PUT /api/profile/birth-data', keys: Object.keys(response.details) });
+          
+          // Set field-specific errors
+          const errors: Record<string, string> = {};
+          if (response.details.birth_time) errors.birth_time = response.details.birth_time[0];
+          if (response.details.birth_date) errors.birth_date = response.details.birth_date[0];
+          setFieldErrors(errors);
+        } else {
+          // Generic error for non-validation errors
+          setGeneralError(response.error || 'Unable to save. Please try again.');
+        }
       }
     } catch (error) {
       console.error('Failed to update birth data:', error);
@@ -68,6 +91,7 @@ const ProfileBirthDataSection: React.FC = () => {
     }
   };

   const handleCancel = () => {
+    setFieldErrors({});
+    setGeneralError('');
     setIsEditing(false);
   };
```

### src/utils/csrfMutations.ts - Add Typed Error Details Pass-Through

```diff
@@ -4,6 +4,7 @@ import { emitAuthBreadcrumb } from './authTelemetry';
 interface MutationResponse<T = any> {
   ok: boolean;
   data?: T;
   error?: string;
   code?: string;
+  details?: Record<string, string[]>;
 }

 interface CSRFError {
@@ -175,6 +176,7 @@ export async function mutateWithCsrf<T = any>(
     return {
       ok: response.ok,
       data: response.ok ? data : undefined,
       error: response.ok ? undefined : (data.error || `HTTP ${response.status}`),
       code: data.code,
+      details: data.details,
     };

   } catch (error) {
```

### src/components/ProfileBirthDataSection.tsx - Add Error Display UI

```diff
@@ -150,6 +150,20 @@ const ProfileBirthDataSection: React.FC = () => {
         <div className="space-y-4">
           <h3 className="text-lg font-medium">Birth Information</h3>
           
+          {/* General Error Display */}
+          {generalError && (
+            <Alert variant="destructive">
+              <AlertDescription>{generalError}</AlertDescription>
+            </Alert>
+          )}
+          
           <BirthDataForm
             initialData={initialFormData}
             onSubmit={handleSubmit}
             onCancel={handleCancel}
+            fieldErrors={fieldErrors}
           />
         </div>
       ) : (
```

## Contracts & Flags

### Error Handling Contract
- ✅ **Typed errors**: Extract details.birth_time[0] and details.birth_date[0] for inline display
- ✅ **Generic errors**: Show "Unable to save. Please try again." for non-validation errors
- ✅ **No refetch on 4xx**: Keep form state populated for correction

### Diagnostics Contract  
- ✅ **Keys only**: No values or PII logged
- ✅ **Request keys**: bd_req_keys with Object.keys(payload)
- ✅ **Error keys**: bd_resp_err_keys with Object.keys(details) on 4xx
- ✅ **Route identification**: 'PUT /api/profile/birth-data'

### Response Contract
- ✅ **Pass-through**: Add details field to MutationResponse interface
- ✅ **Unchanged behavior**: No impact on successful responses
- ✅ **CSRF handling**: Existing retry logic preserved

## Risk & Rollback

- **Risk Level**: Very Low
- **Scope**: Error display and diagnostics only
- **No payload changes**: Outbound request unchanged
- **Rollback**: Single-commit revert available
- **Dependencies**: Requires @/components/ui/alert (likely already available)

## Test Plan

### Setup
```bash
cd /home/ubuntu/glow-intelligence-project/repos/glow-frontend-v2
npm run dev  # Start development server
```

### Browser Testing

**1. Trigger Known Validation Error**
- Open Profile page, edit Birth Information
- Enter time that currently causes validation error (whatever format the form sends)
- Submit and observe:
  - ✅ Inline error message appears under time field
  - ✅ Console shows bd_req_keys with field names only
  - ✅ Console shows bd_resp_err_keys with error field names only
  - ✅ No values/PII in console output
  - ✅ Form remains populated (no refetch)

**2. Test Generic Error Handling**
- Simulate network error or non-validation 4xx
- Observe:
  - ✅ Generic error banner appears
  - ✅ No field-specific errors shown

**3. Test Happy Path**
- Submit valid data (if any format currently works)
- Observe:
  - ✅ Success behavior unchanged
  - ✅ bd_req_keys logged
  - ✅ No error messages displayed

### Console Output Examples

**Request diagnostics (expected)**:
```
bd_req_keys { route: 'PUT /api/profile/birth-data', keys: ['birth_date', 'birth_time', 'birth_location', 'birth_coordinates'] }
```

**Error diagnostics (expected)**:
```  
bd_resp_err_keys { route: 'PUT /api/profile/birth-data', keys: ['birth_time'] }
```

**NOT expected (values/PII)**:
```
❌ { birth_time: '21:17:00', birth_date: '1990-05-11' }  // Values logged
❌ { user_id: 123, email: 'user@example.com' }          // PII logged
```

## Acceptance Criteria

1. ✅ **Typed error display**: Backend validation messages appear inline for birth_time/birth_date fields
2. ✅ **Keys-only diagnostics**: Console shows bd_req_keys and bd_resp_err_keys with field names only
3. ✅ **No value logging**: Console output contains no values or PII
4. ✅ **No refetch on 4xx**: Form remains populated for correction
5. ✅ **Happy path unchanged**: Successful saves work as before

## CLI Test Plan (Optional)

```bash
# Verify backend still returns typed errors
curl -i -b cookies.txt -H "X-CSRF-Token: <token>" \
  -H "Content-Type: application/json" \
  -X PUT "https://www.glowme.io/api/profile/birth-data" \
  --data '{"birth_time":"21:17:00"}'
# Expected: 400 with {"details":{"birth_time":["must match HH:mm (24h)"]}}
```

## Implementation Notes

- **BirthDataForm component**: May need fieldErrors prop added to display inline errors
- **Alert component**: Uses shadcn/ui alert component for error display
- **Error state management**: Local state for field errors and general errors
- **Console logging**: Uses console.info for diagnostics (dev-only)
- **No payload changes**: Current formatBirthData logic unchanged

## Expected UI Behavior

**Before fix**: Generic error handling, no specific field feedback
**After fix**: 
- Time validation error shows "must match HH:mm (24h)" under time input
- Date validation error shows specific message under date input  
- Console shows keys-only diagnostics for debugging
- Form stays populated for easy correction

