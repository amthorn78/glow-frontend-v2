# BRA: Gx3_time_HH_mm_adapter

**Gate**: Gx3_time_HH_mm_adapter  
**Phase**: BRA (Business Requirements Analysis)  
**Objective**: Make frontend send birth_time in strict 24h HH:mm format so saves succeed against backend validator  

## Implementation Plan

### File 1: src/utils/time.ts (~30 LOC)

**Purpose**: Create guarded time formatting helper that only transforms known patterns

**Implementation Steps**:
1. Create new file `src/utils/time.ts`
2. Implement `formatTimeToHHMM` function with three transformation cases:
   - **Case 1**: HH:mm:ss → HH:mm (drop seconds)
   - **Case 2**: h:mm am/pm → HH:mm (12h to 24h conversion)
   - **Case 3**: H:m → HH:mm (zero-pad single digits)
3. Add regex validation for each transformation
4. Return original string unchanged if no pattern matches (let backend validate)

**Key Logic**:
- Use regex patterns to identify transformable inputs
- Validate output with `/^((0\d|1\d|2[0-3])):([0-5]\d)$/` 
- Never invent times - return original if parsing fails

### File 2: src/components/ProfileBirthDataSection.tsx (~15 LOC)

**Purpose**: Update submit handler to use time formatter and clean payload

**Implementation Steps**:
1. Import `formatTimeToHHMM` from utils/time
2. Update `formatBirthData` function to:
   - Use `formatTimeToHHMM` for birth_time
   - Ensure snake_case keys (birth_date, birth_time, birth_location)
   - Remove timezone/coordinates from payload
3. Keep existing date format unchanged (should already be correct)

**Payload Structure**:
```javascript
{
  birth_date: "YYYY-MM-DD",  // unchanged
  birth_time: "HH:mm",       // formatted
  birth_location: "string"   // unchanged
}
```

## Transformation Logic

### Input → Output Examples

| Input | Pattern Match | Output | Result |
|-------|---------------|--------|---------|
| "14:25:00" | HH:mm:ss | "14:25" | ✅ 200 |
| "9:05 pm" | h:mm am/pm | "21:05" | ✅ 200 |
| "9:5" | H:m | "09:05" | ✅ 200 |
| "25:99" | No match | "25:99" | ❌ 400 (correct) |
| "foo" | No match | "foo" | ❌ 400 (correct) |

### Regex Patterns Used

1. **Seconds Pattern**: `/^(\d{1,2}):(\d{2}):\d{2}$/i`
2. **12h Pattern**: `/^(\d{1,2}):(\d{1,2})\s*([ap]m)$/i`
3. **Zero-pad Pattern**: `/^(\d{1,2}):(\d{1,2})$/`
4. **Validation Pattern**: `/^((0\d|1\d|2[0-3])):([0-5]\d)$/`

## Error Handling Strategy

**Philosophy**: Only transform what we know is safe, let backend handle validation

- **Known patterns**: Transform to HH:mm format
- **Unknown patterns**: Pass through unchanged
- **Invalid results**: Return original input
- **Backend validation**: Still works for edge cases

## Testing Strategy

### Manual Test Cases

1. **Drop Seconds Test**:
   - Input: "14:25:00" 
   - Expected: birth_time="14:25", 200 response

2. **12h to 24h Test**:
   - Input: "9:05 pm"
   - Expected: birth_time="21:05", 200 response

3. **Zero-pad Test**:
   - Input: "9:5"
   - Expected: birth_time="09:05", 200 response

4. **Invalid Passthrough Test**:
   - Input: "25:99"
   - Expected: birth_time="25:99", 400 response with typed error

### Verification Points

- ✅ Payload uses snake_case keys only
- ✅ No timezone/coordinates in request
- ✅ Date format unchanged (YYYY-MM-DD)
- ✅ Invalid inputs still return proper 400 errors
- ✅ /api/auth/me reflects saved HH:mm time after success

## Risk Assessment

**Risk Level**: Very Low

**Mitigations**:
- **Guarded transformations**: Only known patterns transformed
- **Validation checks**: Output validated before returning
- **Fallback behavior**: Unknown inputs passed through unchanged
- **Single commit**: Easy rollback if issues arise

## Implementation Order

1. **Create time utility**: Implement and test helper function
2. **Update submit handler**: Import and use formatter
3. **Clean payload**: Remove unnecessary fields
4. **Test locally**: Verify transformations work correctly

## Success Criteria

- ✅ "21:17:00" saves successfully (seconds dropped)
- ✅ "9:05 pm" saves successfully (converted to 21:05)
- ✅ "9:5" saves successfully (zero-padded to 09:05)
- ✅ Invalid inputs still return 400 with typed details
- ✅ Payload contains only required snake_case keys

## Ready for R2C

All implementation details defined and validated. Ready to proceed with code implementation and R2C request.

