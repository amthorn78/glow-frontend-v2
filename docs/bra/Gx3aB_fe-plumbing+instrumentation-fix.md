# BRA: Gx3aB_fe-plumbing+instrumentation-fix

**Gate**: Gx3aB_fe-plumbing+instrumentation-fix  
**Phase**: BRA → R2C  
**Objective**: Surface backend typed validation errors in Profile Birth Data form and add runtime-gated instrumentation  

## Implementation Plan

### File 1: src/utils/csrfMutations.ts (~30 LOC)

**Changes**:
1. Add `debugKeysOnly()` runtime helper function
2. Fix non-throwing 4xx response handling 
3. Add runtime-gated bd_req_keys and bd_resp_meta logging
4. Add HH:mm regex check (boolean result only)

**Implementation Steps**:
- Add helper function at top of file
- Modify error handling in `mutateWithCsrf` to return structured object instead of throwing
- Add request logging before fetch
- Add response metadata logging with HH:mm boolean check
- Ensure all logging is gated behind `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY`

### File 2: src/components/ProfileBirthDataSection.tsx (~35 LOC)

**Changes**:
1. Add useEffect import
2. Add runtime debug helper function  
3. Add bd_component_mount sentinel with route info
4. Fix error handling to call `setFieldErrors(response.details)` on 400
5. Add runtime-gated bd_resp_err_keys logging
6. Ensure no refetch on 4xx errors

**Implementation Steps**:
- Import useEffect from React
- Add debugKeysOnly helper function
- Add component mount sentinel in useEffect
- Modify submit handler error handling logic
- Wire field errors to form display
- Add error response logging

### File 3: src/components/BirthDataForm.tsx (minimal changes)

**Changes**:
- Verify fieldErrors prop is accepted and displayed
- No visual redesign needed

**Implementation Steps**:
- Check current fieldErrors implementation
- Ensure errors display inline under time field
- No changes needed if already implemented

## Runtime Flag Implementation

**Flag**: `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY`  
**Default**: `false`  
**Purpose**: Enable keys-only diagnostics in production temporarily  

**Helper Function**:
```typescript
const debugKeysOnly = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === 'true');
};
```

## Logging Contract

**Keys-Only Policy**: Never log values, IDs, emails, or PII  
**Expected Logs**:
- `bd_component_mount { route: 'PUT /api/profile/birth-data' }`
- `bd_req_keys { keys: ['date','time','timezone','location','latitude','longitude'] }`
- `bd_resp_meta { ok: false, status: 400, has_details: true, matches_hhmm: false }`
- `bd_resp_err_keys { keys: ['birth_time'] }`

## Error Handling Flow

**Current (Broken)**:
1. Backend returns 400 with `{"details":{"birth_time":["must match HH:mm (24h)"]}}`
2. Mutation wrapper throws error
3. Component catches generic error
4. No field-specific errors displayed

**Fixed Flow**:
1. Backend returns 400 with validation details
2. Mutation wrapper returns structured object `{ ok: false, status: 400, error, details }`
3. Component checks `!ok && status === 400 && details`
4. Component calls `setFieldErrors(details)`
5. Form displays inline error under time field

## Testing Strategy

**Manual Test Plan**:
1. Set `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY=true` in Vercel
2. Navigate to Profile → Birth Data
3. Enter invalid time '14:25:00' and save
4. Verify inline error displays: "must match HH:mm (24h)"
5. Verify console shows four breadcrumbs (keys/booleans only)
6. Enter valid time '14:25' and save
7. Verify success path works, errors clear
8. Turn flag OFF and redeploy

## Acceptance Criteria

**A) Inline Error Display**: Invalid time shows validation message under field, no refetch, form stays populated  
**B) Console Instrumentation**: Four breadcrumbs appear with flag ON (keys/booleans only)  
**C) Happy Path**: Valid time succeeds, errors clear, profile updates via refetch  

## Risk Assessment

**Risk Level**: Low  
- Instrumentation only with runtime gating
- Non-throwing 4xx fix is isolated change
- Single commit revert available
- Default flag OFF prevents production log pollution

## Implementation Order

1. **csrfMutations.ts**: Fix non-throwing 4xx first (critical for error display)
2. **ProfileBirthDataSection.tsx**: Add field error wiring and instrumentation
3. **BirthDataForm.tsx**: Verify/minimal changes for error display
4. **Test**: Manual verification with flag ON/OFF

## Rollback Plan

If any issues:
1. Revert single commit
2. Ensure `NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY=false` in Vercel
3. Redeploy to clear any logging

## Ready for R2C

All implementation details defined. Ready to proceed with code changes and testing.

