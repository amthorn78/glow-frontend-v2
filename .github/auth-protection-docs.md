# Auth v2 Protection System

## Overview

This document describes the comprehensive protection system implemented to prevent authentication regressions in the GLOW application.

## Protection Phases

### Phase A: Immediate CI Gates ✅ IMPLEMENTED
**Purpose**: Fail-fast on core cookie/session contract before any deploy

**Checks**:
- `/api/health` returns 200 JSON
- `/api/auth/login` returns 200 JSON with proper Set-Cookie attributes
- `/api/auth/me` (authenticated) returns 200 JSON
- `/api/auth/logout` returns 200 JSON
- `/api/auth/me` (unauthenticated) returns 401 JSON
- All responses must be JSON (never HTML/empty)

**Required Cookie Attributes**:
- `HttpOnly`
- `Secure` 
- `SameSite=Lax`
- `Path=/`

**Workflow**: `.github/workflows/auth-protection.yml` (job: `auth-contracts-prod-smoke`)

### Phase B: Preview E2E 🚧 PLACEHOLDER
**Purpose**: Ensure frontend bootstrap never loops and /me is handled correctly

**Scenarios** (to be implemented):
- Logged-out load → single `/api/auth/me` 401 → redirect to `/login`
- Valid login → cookie set → single `/api/auth/me` 200 → navigate to destination
- Refresh while logged-in → single `/api/auth/me` 200 → app renders
- Logout → `/api/auth/logout` 200 → `/api/auth/me` 401 → redirect
- Protected route guards work correctly
- Public-only route guards work correctly

**Assertions**:
- No infinite spinners (6s timeout)
- No absolute URLs in requests
- Network cap: ≤1 `/api/auth/me` call during bootstrap

**Workflow**: `.github/workflows/auth-protection.yml` (job: `auth-e2e-preview`)

### Phase C: Static Guards ✅ IMPLEMENTED
**Purpose**: Stop risky changes before runtime

**Checks**:
- No absolute URLs (`http://` or `https://`) in frontend API client
- No `Authorization` or `Bearer` headers in frontend code
- No token storage in `localStorage`/`sessionStorage`
- No throwing on `/api/auth/me` 401 responses

**Workflow**: `.github/workflows/auth-protection.yml` (job: `auth-static-guards`)

### Phase D: Synthetic Monitoring ✅ IMPLEMENTED
**Purpose**: Catch drift after deploys, auto-alert

**Frequency**: Every 10 minutes

**Probes**:
- Health check
- Login cookie validation
- Authenticated `/me` check
- Logout functionality
- Unauthenticated `/me` check

**Alerts**: Job failure indicates potential auth system degradation

**Workflow**: `.github/workflows/synthetic-monitoring.yml`

## Branch Protection

The following jobs are required to pass before merging to `main`:
- `auth-contracts-prod-smoke` (Phase A)
- `auth-static-guards` (Phase C)
- `auth-e2e-preview` (Phase B - when implemented)

## Non-Regression Invariants

1. **401 from `/api/auth/me`** is treated as 'unauthenticated data' by frontend (no global redirect)
2. **All auth endpoints return JSON** (never HTML/empty)
3. **Cookie attributes**: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` on login; identical attributes on logout with `Max-Age=0`
4. **Frontend bootstrap** resolves on first `/me` call (no retries), and sets `isInitialized=true`

## Rollback Plan

### Triggers
- Spike in `/me` 401 for authenticated users
- Missing Set-Cookie or malformed cookie attributes
- HTML responses from auth endpoints
- Bootstrap loops detected in client telemetry

### Actions
1. Revert frontend to last known good build (by SHA)
2. Revert backend to last known good release (by tag)
3. Keep synthetic monitors running
4. Confirm smoke tests green before re-opening deploys

## Manual Smoke Script

For manual validation:

1. **Logged-out load**: App loads → single `/me` 401 JSON → redirected to `/login`
2. **Login**: Valid credentials → Set-Cookie with required attributes → `/me` 200 JSON → routed to destination
3. **Refresh**: Page refresh → `/me` 200 once → remains logged-in
4. **Logout**: Logout button → `/logout` 200 JSON → `/me` 401 JSON → redirected to login
5. **Cross-tab**: Login in tab A → tab B becomes authenticated; logout in A → B logs out within ~1s

## Implementation Status

- ✅ **Phase A**: Immediate CI Gates
- ✅ **Phase C**: Static Guards  
- ✅ **Phase D**: Synthetic Monitoring
- 🚧 **Phase B**: Preview E2E (placeholder implemented)

## Next Steps

1. Implement Phase B E2E tests with Playwright
2. Set up alerting for synthetic monitoring failures
3. Document release ritual and checklist
4. Add contract versioning for future API changes

