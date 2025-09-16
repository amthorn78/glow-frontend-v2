# Frontend Architecture Map - Birth Data Save Flow

## Active Execution Path (Profile → Birth Data)

```
User navigates to /profile
    ↓
App.tsx (line 82)
    ↓ Route: "/profile" 
ProfilePage.tsx (line 332)
    ↓ Renders: <BirthDataFormCanonical />
BirthDataFormCanonical.tsx
    ↓ onSubmit: handleSubmit (line 239)
    ↓ Calls: normalizeTime() (line 258) ← ADDS SECONDS!
    ↓ Creates: birthDataPayload (line 256) ← WRONG KEYS!
    ↓ Calls: updateBirthDataWithCsrf(payload) (line 272)
csrfMutations.ts
    ↓ Makes: PUT /api/profile/birth-data
Backend API
    ↓ Returns: 400 "must match HH:mm (24h)"
```

## File References with Line Numbers

### 1. Routing Layer
**File**: `src/App.tsx`
- **Line 82**: `path="/profile"` route definition
- **Line 85**: `<ProfilePage />` component

### 2. Page Layer  
**File**: `src/pages/ProfilePage.tsx`
- **Line 7**: `import BirthDataFormCanonical from '../components/BirthDataFormCanonical';`
- **Line 332**: `<BirthDataFormCanonical />` render

### 3. Form Component (ACTIVE)
**File**: `src/components/BirthDataFormCanonical.tsx`
- **Line 230-236**: `normalizeTime()` function (ADDS SECONDS)
- **Line 239**: `handleSubmit()` function
- **Line 256-263**: `birthDataPayload` object (WRONG KEYS)
- **Line 258**: `time: normalizeTime(formData.time)` (PROBLEM)
- **Line 272**: `updateBirthDataWithCsrf(birthDataPayload)` call

### 4. Mutation Layer
**File**: `src/utils/csrfMutations.ts`
- **Function**: `updateBirthDataWithCsrf()`
- **Endpoint**: `PUT /api/profile/birth-data`

## Shadow Components (NOT IN ACTIVE PATH)

### ProfileBirthDataSection.tsx (WHERE WE MADE CHANGES)
- **Status**: ❌ Not used in routing
- **Location**: Exists but not imported/rendered anywhere
- **Our Changes**: Applied time format adapter here (wasted effort)

### Other Birth Data Components
- `BirthDataForm.tsx` - Legacy component
- `EnhancedBirthDataForm.tsx` - Alternative implementation  
- `StructuredBirthDataForm.tsx` - Alternative implementation
- `BirthDataModal.tsx` - Modal variant

## Data Flow Analysis

### Current (Broken) Flow
```
Form Input: "14:25" (HH:mm)
    ↓
normalizeTime(): "14:25" → "14:25:00" (ADDS :00)
    ↓  
Payload: { date: "2023-01-01", time: "14:25:00", ... } (camelCase)
    ↓
Backend: 400 "must match HH:mm (24h)"
```

### Required (Fixed) Flow  
```
Form Input: "14:25" (HH:mm)
    ↓
normalizeTime(): "14:25" → "14:25" (NO CHANGE)
    ↓
Payload: { birth_date: "2023-01-01", birth_time: "14:25", birth_location: "..." }
    ↓
Backend: 200 Success
```

## Component Hierarchy

```
App.tsx
├── Router
    ├── Route: /profile
        └── ProfilePage.tsx
            ├── User Info Section
            ├── Magic10 Section  
            └── Birth Data Section
                └── BirthDataFormCanonical.tsx ← ACTIVE COMPONENT
                    ├── Form Fields (date, time, location)
                    ├── handleSubmit() ← PROBLEM FUNCTION
                    └── updateBirthDataWithCsrf() ← API CALL
```

## Key Functions Call Graph

```
BirthDataFormCanonical.handleSubmit()
    ├── validateForm() ← Client validation
    ├── normalizeTime(formData.time) ← ADDS SECONDS (BUG)
    ├── Create birthDataPayload ← WRONG KEYS (BUG)  
    └── updateBirthDataWithCsrf(payload)
        └── PUT /api/profile/birth-data
            └── Backend validation fails (400)
```

## Critical Issues in Active Path

1. **Line 232**: `return \`${time}:00\`;` - Adds seconds instead of removing
2. **Line 257**: `date: formData.date` - Should be `birth_date`  
3. **Line 258**: `time: normalizeTime(formData.time)` - Should be `birth_time` with no seconds
4. **Line 259-262**: Includes timezone/coordinates - Should be omitted

## Fix Locations

**Primary Fix**: `src/components/BirthDataFormCanonical.tsx`
- **Lines 230-236**: Fix normalizeTime function
- **Lines 256-263**: Fix payload structure

**Secondary Cleanup**: Remove unused components
- `src/components/ProfileBirthDataSection.tsx` (our wasted changes)
- Other shadow birth data components

