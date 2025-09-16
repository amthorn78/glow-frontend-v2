# Frontend Fix Roadmap

## Overview

**Goal**: Fix birth data save functionality by correcting the active component
**Root Cause**: Wrong component edited + time format bug in active component
**Strategy**: Minimal, targeted fixes to the actual execution path

## Gate Sequence

### Gate 1: Gx4_canonical_time_fix (P0 - Critical)
**Objective**: Fix the normalizeTime function in BirthDataFormCanonical to remove seconds instead of adding them

**Files**: 1 file, ~5 LOC
- `src/components/BirthDataFormCanonical.tsx` (lines 230-236)

**Changes**:
```diff
-const normalizeTime = (time: string): string => {
-  // Input is HH:MM, server expects HH:MM:SS
-  if (time && time.includes(':') && time.split(':').length === 2) {
-    return `${time}:00`;
-  }
-  return time;
-};
+const normalizeTime = (time: string): string => {
+  // Server expects HH:mm (no seconds)
+  if (time && time.includes(':')) {
+    const parts = time.split(':');
+    return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
+  }
+  return time;
+};
```

**Acceptance**: 
- Input "14:25" saves successfully (no seconds added)
- Backend receives "14:25" not "14:25:00"

**Risk**: Very Low (single function change)
**LOC**: ~8 lines

---

### Gate 2: Gx4_canonical_payload_keys (P0 - Critical)  
**Objective**: Fix payload structure to use snake_case keys and omit unnecessary fields

**Files**: 1 file, ~10 LOC
- `src/components/BirthDataFormCanonical.tsx` (lines 256-263)

**Changes**:
```diff
const birthDataPayload = {
-  date: formData.date,
-  time: normalizeTime(formData.time),
-  timezone: formData.timezone,
-  location: formData.location.trim(),
-  latitude: formData.latitude,
-  longitude: formData.longitude
+  birth_date: formData.date,
+  birth_time: normalizeTime(formData.time),
+  birth_location: formData.location.trim()
};
```

**Acceptance**:
- Payload uses snake_case keys (birth_date, birth_time, birth_location)
- No timezone/coordinates sent
- Backend accepts payload structure

**Risk**: Very Low (payload structure change)
**LOC**: ~8 lines

---

### Gate 3: Gx4_shadow_component_cleanup (P1 - High)
**Objective**: Remove or consolidate unused birth data components to prevent future confusion

**Files**: 4-6 files, ~20 LOC
- Remove `src/components/ProfileBirthDataSection.tsx` (our wasted changes)
- Remove `src/components/BirthDataForm.tsx` (if unused)
- Remove `src/components/EnhancedBirthDataForm.tsx` (if unused)
- Remove `src/components/StructuredBirthDataForm.tsx` (if unused)

**Changes**:
- Delete unused component files
- Remove imports if any
- Update documentation

**Acceptance**:
- Only active birth data components remain
- No broken imports
- Clear component hierarchy

**Risk**: Low (removing unused code)
**LOC**: ~0 (deletions)

---

### Gate 4: Gx4_time_adapter_relocate (P2 - Medium)
**Objective**: Move the time format adapter from unused component to shared utility

**Files**: 2 files, ~15 LOC
- Move `formatTimeToHHMM` from `src/utils/time.ts` to shared location
- Update `BirthDataFormCanonical.tsx` to use shared adapter (if needed for edge cases)

**Changes**:
- Relocate time formatting logic
- Ensure all components use same time handling
- Add unit tests for time formatting

**Acceptance**:
- Consistent time formatting across all components
- Edge cases handled (12h format, single digits, etc.)
- No duplicate time formatting logic

**Risk**: Low (code organization)
**LOC**: ~15 lines

---

### Gate 5: Gx4_error_display_fix (P2 - Medium)
**Objective**: Ensure typed validation errors display properly in the UI

**Files**: 1 file, ~10 LOC  
- `src/components/BirthDataFormCanonical.tsx` (error handling section)

**Changes**:
- Verify error response handling
- Ensure `response.details` reaches form state
- Display field-specific errors inline

**Acceptance**:
- Invalid inputs show specific validation messages
- "must match HH:mm (24h)" displays for time format errors
- Generic errors don't mask specific validation details

**Risk**: Low (error display improvement)
**LOC**: ~10 lines

## Implementation Order

**Phase 1 (Immediate - P0)**:
1. Gate 1: Fix normalizeTime function
2. Gate 2: Fix payload keys

**Phase 2 (Short-term - P1)**:
3. Gate 3: Clean up shadow components

**Phase 3 (Medium-term - P2)**:
4. Gate 4: Relocate time adapter
5. Gate 5: Fix error display

## Total Effort Estimate

**Critical Fixes (Gates 1-2)**: ~20 LOC, 2 files, 1-2 hours
**Cleanup (Gate 3)**: ~0 LOC (deletions), 4-6 files, 1 hour  
**Improvements (Gates 4-5)**: ~25 LOC, 3 files, 2-3 hours

**Total**: ~45 LOC, 6-9 files, 4-6 hours

## Risk Mitigation

**All Gates**:
- Single-commit revert available
- Changes isolated to specific functions
- No breaking changes to API contracts
- Maintain existing CSRF protection

**Testing Strategy**:
- Manual testing after each gate
- Verify birth data saves successfully
- Confirm error messages display correctly
- Check payload structure in network tab

## Success Metrics

**Primary**:
- Users can save birth data without validation errors
- Time format "14:25" saves as "14:25" (no seconds)

**Secondary**:
- Clean component hierarchy
- Consistent error handling
- No shadow/unused components

**Tertiary**:
- Shared time formatting utilities
- Comprehensive error display

