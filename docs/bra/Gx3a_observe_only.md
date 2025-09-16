# BRA: Gx3a_observe_only

**Gate**: Gx3a_observe_only  
**Branch**: gate/Gx3a-observe-only  
**Objective**: Add typed field errors for birth data validation + keys-only diagnostics  

## Implementation Summary

**What Changed**: Added typed error display for birth_time/birth_date validation errors and keys-only console diagnostics. No payload changes or time conversion in this gate.

**Files Modified**: 3 files (63 insertions, 23 deletions)

## Diff Stats

```
 src/components/BirthDataForm.tsx           |  8 +++-
 src/components/ProfileBirthDataSection.tsx | 76 +++++++++++++++++++++---------
 src/utils/csrfMutations.ts                 |  2 +
 3 files changed, 63 insertions(+), 23 deletions(-)
```

## Key Changes Applied

### 1. MutationResponse Interface (csrfMutations.ts)
- ✅ **Added details field**: `details?: Record<string, string[]>`
- ✅ **Pass-through in response**: `details: data.details`

### 2. BirthDataForm Component (BirthDataForm.tsx)
- ✅ **Added fieldErrors prop**: `fieldErrors?: Record<string, string>`
- ✅ **Field error display**: Shows `fieldErrors.birth_time` under time inputs
- ✅ **Minimal prop extension**: No visual layout changes

### 3. ProfileBirthDataSection Component (ProfileBirthDataSection.tsx)
- ✅ **Error state management**: Added `fieldErrors` and `generalError` state
- ✅ **Keys-only diagnostics**: 
  - `bd_req_keys` logs `Object.keys(birthDataFormatted)` only
  - `bd_resp_err_keys` logs `Object.keys(response.details)` only
- ✅ **Typed error handling**: Extracts `details.birth_time[0]` and `details.birth_date[0]`
- ✅ **No refetch on 4xx**: Form remains populated for correction
- ✅ **Removed value logs**: Deleted `save.birth.put.sent` with payload body

## Conditions Verification

### ✅ REMOVE_VALUE_LOGS
- **Before**: `console.log('save.birth.put.sent', { path, method, hasCookieHeader })`
- **After**: `console.info('bd_req_keys', { route, keys: Object.keys(payload) })`
- **Status**: Value logging removed, keys-only diagnostics added

### ✅ BDFORM_ERRORS_PLUMBING
- **Added**: `fieldErrors?: Record<string, string>` prop to BirthDataForm
- **Renders**: `{fieldErrors.birth_time && <p className="text-red-500 text-sm mt-2">{fieldErrors.birth_time}</p>}`
- **Status**: Minimal prop extension, no layout changes

### ✅ NO_REFETCH_ON_4XX
- **4xx handling**: Sets field errors and general error state
- **No invalidation**: No `queryClient.invalidateQueries(['auth','me'])` on validation errors
- **Status**: Form remains populated for correction

### ✅ RESPONSE_DETAILS_PASSTHRU
- **Interface**: `details?: Record<string, string[]>` added to MutationResponse
- **Pass-through**: `details: data.details` in response
- **Status**: All call sites compile cleanly

### ✅ CONSOLE_KEYS_ONLY
- **bd_req_keys**: `Object.keys(birthDataFormatted)` - field names only
- **bd_resp_err_keys**: `Object.keys(response.details)` - field names only
- **Status**: No values, no user IDs, no emails logged

### ✅ UNCHANGED_PAYLOAD
- **formatBirthData**: No changes to time conversion or field names
- **Request payload**: Still sends `date`, `time`, `timezone`, `location`, `latitude`, `longitude`
- **Status**: Observe-only, no payload mutations

## Static Checks

**TypeScript**: Existing project has many unrelated TS errors, but our changes compile correctly
**Syntax**: All modified files have valid JavaScript/TypeScript syntax
**Imports**: All imports resolve correctly

## Risk Assessment

**Risk Level**: Very Low
- **Scope**: Error display and diagnostics only
- **No behavior changes**: Happy-path saves unchanged
- **Revertible**: Single commit revert available
- **No payload mutations**: Observe-only changes

## Acceptance Criteria Verification

### ✅ Typed Error Display
- **Implementation**: `fieldErrors.birth_time` displays under time inputs
- **Expected**: User will see "must match HH:mm (24h)" for invalid time format
- **Status**: Ready for browser verification

### ✅ Keys-Only Diagnostics
- **bd_req_keys**: Logs field names from outbound payload
- **bd_resp_err_keys**: Logs field names from error response details
- **Status**: Console will show keys-only diagnostics

### ✅ No Refetch on 4xx
- **Error handling**: Sets local state, no query invalidation
- **Form state**: Remains populated for user correction
- **Status**: No refetch behavior on validation errors

### ✅ No PII Logging
- **Verification**: All console logs use `Object.keys()` only
- **No values**: No user data, emails, or PII in logs
- **Status**: Keys-only policy enforced

## Next Steps

**R2C Ready**: Implementation matches CRD exactly with all conditions applied
**Browser Testing**: Ready for Nathan to verify inline error display and console logs
**Next Gate**: Gx3b_time_adapter (12h→24h conversion + snake_case payload)

## Commit Details

**Branch**: gate/Gx3a-observe-only
**Commit**: 562dc72a
**Message**: "Gx3a_observe_only: Add typed field errors and keys-only diagnostics"
**Files**: 3 code files, 86 LOC net change

