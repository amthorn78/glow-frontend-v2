# Frontend Reliability Checklist

## Pre-Edit Verification

### 1. Identify Active Component
- [ ] Trace route from App.tsx to target functionality
- [ ] Verify component import and render location
- [ ] Check for multiple components with similar names
- [ ] Confirm component is not shadow/unused

### 2. Verify Execution Path
- [ ] Follow function call chain from UI event to API call
- [ ] Identify all intermediate functions and transformations
- [ ] Check for conditional logic that may bypass changes
- [ ] Verify no early returns skip modified code

### 3. Check Build Configuration
- [ ] Verify file is included in build process
- [ ] Check for TypeScript compilation errors
- [ ] Confirm no dead code elimination removes changes
- [ ] Verify environment flags don't disable code paths

## During Edit Process

### 4. Single Source of Truth
- [ ] Identify all functions that handle same data
- [ ] Ensure only one authoritative submit path exists
- [ ] Remove or consolidate duplicate implementations
- [ ] Document which component/function is canonical

### 5. Payload Structure Verification
- [ ] Check API contract for required keys (snake_case vs camelCase)
- [ ] Verify data types match backend expectations
- [ ] Confirm no extra fields are included
- [ ] Test payload structure with backend validation

### 6. Error Handling Path
- [ ] Verify error responses reach UI components
- [ ] Check for mutation wrappers that throw on 4xx
- [ ] Ensure field-specific errors display correctly
- [ ] Test both success and failure scenarios

## Post-Edit Verification

### 7. Build and Deploy Verification
- [ ] Confirm changes appear in built bundle
- [ ] Verify deployment includes updated files
- [ ] Check build timestamp/version in UI
- [ ] Confirm no cache issues prevent updates

### 8. Runtime Flag Verification
- [ ] Check environment variables are set correctly
- [ ] Verify debug flags are enabled if needed
- [ ] Confirm feature flags don't disable functionality
- [ ] Test with production-like environment settings

### 9. Cache and State Management
- [ ] Verify query invalidation works correctly
- [ ] Check for race conditions in state updates
- [ ] Confirm no stale data overwrites changes
- [ ] Test refetch behavior after mutations

## Testing Protocol

### 10. Manual Testing Steps
- [ ] Test happy path with valid inputs
- [ ] Test error path with invalid inputs
- [ ] Verify network requests in browser dev tools
- [ ] Check payload structure in network tab
- [ ] Confirm response handling works correctly

### 11. Cross-Browser Testing
- [ ] Test in Chrome (primary)
- [ ] Test in Firefox
- [ ] Test in Safari (if applicable)
- [ ] Verify mobile responsiveness

### 12. Integration Testing
- [ ] Test full user flow end-to-end
- [ ] Verify data persistence after page refresh
- [ ] Check integration with other features
- [ ] Confirm no regressions in related functionality

## Common Failure Points

### 13. Component Identification Issues
- Multiple components with similar names
- Shadow components not in active routing
- Legacy components still referenced
- Modal vs page component confusion

### 14. Data Transformation Issues
- Multiple transformation functions
- Conflicting data format expectations
- Missing or incorrect field mappings
- Type conversion errors

### 15. State Management Issues
- Mutation wrapper throwing on 4xx
- Query invalidation not working
- Race conditions in updates
- Stale closure capturing old state

### 16. Build and Deploy Issues
- Files not included in build
- Environment variables not set
- Cache not cleared after deploy
- Feature flags disabling code

## Debugging Tools

### 17. Browser Developer Tools
- Network tab for request/response inspection
- Console for error messages and logs
- React DevTools for component state
- Application tab for localStorage/cookies

### 18. Code Analysis Tools
- TypeScript compiler for type checking
- ESLint for code quality issues
- Bundle analyzer for build verification
- Source maps for debugging minified code

### 19. Runtime Debugging
- Console.log statements for data flow
- Debugger breakpoints for step-through
- Network monitoring for API calls
- Performance profiling for bottlenecks

## Documentation Requirements

### 20. Change Documentation
- [ ] Document which component is authoritative
- [ ] Record function call chain for future reference
- [ ] Note any environment dependencies
- [ ] Update architecture diagrams if needed

### 21. Testing Documentation
- [ ] Record test cases for regression testing
- [ ] Document expected payload structures
- [ ] Note any browser-specific issues
- [ ] Maintain troubleshooting guide

