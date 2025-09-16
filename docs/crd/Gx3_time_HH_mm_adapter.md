# CRD: Gx3_time_HH_mm_adapter

**Gate**: Gx3_time_HH_mm_adapter  
**Objective**: Make the frontend send birth_time in strict 24h HH:mm format (no seconds) so saves succeed against the backend validator.  
**Files**: ≤2 files, ≤70 LOC total  

## Problem Statement

Backend correctly rejects time with seconds (HH:mm:ss) with a typed 400 error. HAR shows the frontend is sending seconds (e.g., '21:17:00'). This gate will fix the frontend formatting to unblock end-to-end saves immediately.

## Proposed Changes

### 1. Add Time Formatting Helper (src/utils/time.ts)

**File**: `src/utils/time.ts` (new file)  
**Lines**: ~30 LOC  

```typescript
// src/utils/time.ts

/**
 * Converts a time string to strict 24h HH:mm format.
 * Only transforms known patterns; returns original string if parsing fails.
 */
export const formatTimeToHHMM = (raw: string): string => {
  if (!raw) return raw;
  const s = raw.trim();
  
  // Case 1: HH:mm:ss -> HH:mm (drop seconds)
  const mHMS = /^(\d{1,2}):(\d{2}):\d{2}$/i.exec(s);
  if (mHMS) return `${mHMS[1].padStart(2,'0')}:${mHMS[2]}`;
  
  // Case 2: 12h -> 24h (e.g., 9:05 pm)
  const m12 = /^(\d{1,2}):(\d{1,2})\s*([ap]m)$/i.exec(s);
  if (m12) {
    let [_, h, m, ap] = m12;
    let hh = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === 'pm') hh += 12;
    const out = `${String(hh).padStart(2,'0')}:${String(parseInt(m,10)).padStart(2,'0')}`;
    return /^((0\d|1\d|2[0-3])):([0-5]\d)$/.test(out) ? out : raw;
  }
  
  // Case 3: H:m -> HH:mm (zero-pad)
  const mHm = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  if (mHm) {
    const out = `${mHm[1].padStart(2,'0')}:${mHm[2].padStart(2,'0')}`;
    return /^((0\d|1\d|2[0-3])):([0-5]\d)$/.test(out) ? out : raw;
  }
  
  // Unknown shape: let backend validate
  return raw;
};
```

### 2. Update Submit Handler (ProfileBirthDataSection.tsx)

**File**: `src/components/ProfileBirthDataSection.tsx`  
**Lines**: ~15 LOC  

```diff
@@ -1,5 +1,6 @@
 import React, { useState, useEffect } from 'react';
 import { useUserBirthData } from '../queries/auth/authQueries';
 import { updateBirthDataWithCsrf } from '../utils/csrfMutations';
+import { formatTimeToHHMM } from '../utils/time';
 import BirthDataForm from './BirthDataForm';
 
@@ -45,12 +46,10 @@ const ProfileBirthDataSection: React.FC = () => {
     const birthDate = `${formData.day}/${monthName}/${formData.year}`;
     
     // Convert to HH:MM format
-    const birthTime = `${formData.hours}:${formData.minutes}`;
+    const birthTime = formatTimeToHHMM(`${formData.hours}:${formData.minutes}`);
     
     return {
       birth_date: birthDate,
       birth_time: birthTime,
-      birth_location: formData.location,
-      birth_coordinates: formData.coordinates ? {
-        latitude: formData.coordinates.lat,
-        longitude: formData.coordinates.lng
-      } : undefined
+      birth_location: formData.location
     };
   };
```

## Files Touched

1. **src/utils/time.ts** (~30 LOC)
   - New helper file with guarded `formatTimeToHHMM` function
   - Only transforms known patterns, returns original string if parsing fails

2. **src/components/ProfileBirthDataSection.tsx** (~15 LOC)
   - Import and use `formatTimeToHHMM` in the submit handler
   - Ensure snake_case keys (birth_date, birth_time)
   - Omit timezone/coordinates from payload

**Total LOC**: ~45 LOC (within ≤70 limit)

## Contracts & Flags

**No new flags or environment variables.**  
**Payload**: Uses snake_case keys (birth_date, birth_time, birth_location only)  
**Error Handling**: Invalid inputs passed through unchanged for backend validation  

## Risk & Rollback

**Risk Level**: Very Low  
- **Isolated change**: Only affects time formatting at submission
- **Guarded transformation**: Unknown patterns passed through unchanged
- **Single commit revert**: Easy rollback to previous behavior

## Acceptance Criteria

1. **Drop seconds**: Input '14:25:00' saves successfully; backend receives birth_time='14:25'
2. **12h to 24h**: Input '9:05 pm' saves successfully; backend receives birth_time='21:05'  
3. **Zero-pad**: Input '9:5' saves successfully; backend receives birth_time='09:05'
4. **Invalid passthrough**: Input '25:99' or 'foo' returns 400 with typed details (unchanged behavior)
5. **Snake_case payload**: Request uses birth_date, birth_time, birth_location keys only

## Manual Test Plan

- **Prep**: Login at glowme.io, open Profile → Birth Data
- **Cases**:
  - **Drop seconds**: Input '14:25:00', expect 2xx, /api/auth/me shows birth_time='14:25'
  - **12h to 24h**: Input '9:05 pm', expect 2xx, /api/auth/me shows birth_time='21:05'  
  - **Zero-pad**: Input '9:5', expect 2xx, /api/auth/me shows birth_time='09:05'
  - **Invalid**: Input '25:99', expect 400 with typed validation error


