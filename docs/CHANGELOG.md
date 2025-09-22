# Changelog

All notable changes to the Glow Frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### FE-P0: Reader-first Reflex + Enum Control (2025-01-20)

**Summary**: Implemented a reader-first reflex pattern for lake-compliant UI updates with enhanced Settings page control for preference management.

**Core Features**:
- **Reader-first Reflex Helper** (`src/lib/reflex.ts`): Centralized helper that enforces exactly one refetch of `['auth','me']` after successful writes, with 200ms coalescing and AbortController cancellation to prevent duplicate requests.
- **Enhanced Settings Control**: Upgraded the Settings page with proper correlation ID generation, typed error handling, and accessibility features for preference management.
- **Lake Discipline Enforcement**: Strict adherence to lake principles with no optimistic UI updates - all changes reflect only after successful server confirmation.

**Technical Implementation**:
- **Coalescing Logic**: Multiple rapid calls within 200ms are batched into a single refetch operation to optimize performance.
- **Cancellation Support**: In-flight requests are properly cancelled when new requests are initiated, preventing stale data issues.
- **Correlation ID Continuity**: PUT requests generate correlation IDs that are forwarded to subsequent GET requests for improved traceability.
- **Error Handling**: Comprehensive error handling for validation failures (400), CSRF issues (403), and generic errors with user-friendly messaging.

**Environment Integration**:
- **Feature Flag Support**: Uses `VITE_ENABLE_PREFERRED_PACE_WRITE` for conditional editing capabilities.
- **Debug Visibility**: Optional debug chip displays flag state when `VITE_DEBUG_FLAGS` is enabled.
- **Development Logging**: Correlation ID logging in development mode for debugging purposes.

**Accessibility Enhancements**:
- **ARIA Support**: Error messages include `aria-live="polite"` and `role="alert"` for screen reader compatibility.
- **Visual Indicators**: Clear read-only state indicators and loading states for better user experience.
- **Focus Management**: Proper focus handling during error states and form interactions.

**Files Modified**:
- `src/lib/reflex.ts` (new): Core reflex helper implementation
- `src/pages/SettingsPage.tsx`: Enhanced with correlation ID and error handling
- `src/utils/csrfMutations.ts`: Updated to delegate to reflex helper for consistency

**Dependencies**: Requires BE-P0 backend hotfix for proper preference persistence.

**Rollback**: Single-commit revert of `06e13eeb` restores previous behavior.

---

## Previous Releases

### FE-3b: Vite Flags + Canonical Enum Payload (2025-01-19)
- Switched from Next.js to Vite environment variables for feature flags
- Implemented canonical enum payload handling for preference values
- Enhanced debug visibility with flag state indicators

### FE-3a: Feature Flag Wire-up (2025-01-19)  
- Added centralized feature flag system in `src/lib/flags.ts`
- Implemented conditional rendering based on `PACE_WRITE` flag
- Added debug chip for flag state visibility

### FE-3: Mapping-driven Settings Pack A (2025-01-19)
- Implemented dynamic Settings page rendering from mapping configuration
- Added read-only field components and form enum selects
- Established foundation for scalable settings management

### FE-2: Lake Client Hardening (2025-01-18)
- Implemented request coalescing and cancellation for auth/me queries
- Added strict query options for improved performance
- Enhanced error handling and cleanup mechanisms

### FE-1: Settings Shell Implementation (2025-01-18)
- Created initial read-only Settings page structure
- Implemented basic field rendering components
- Established settings page navigation and layout
