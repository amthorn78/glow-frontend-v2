# CSRF Monitoring Guardrails (S6-MON1)

## Overview
This document outlines the guardrails for the flag-gated, sampled, keys-only CSRF telemetry system. The primary goal is to provide visibility into the CSRF auto-recovery mechanism without compromising user privacy or system performance.

## Security & Privacy Guardrails
- **No PII**: Absolutely no personally identifiable information (PII) should be logged. This includes emails, user IDs, or any other user-specific data.
- **No Tokens or Secrets**: Do not log CSRF tokens, session cookies, or any other sensitive credentials.
- **Keys-Only Logging**: Logs should only contain event names, status codes, and other non-sensitive metadata. No payload values.

## Performance Guardrails
- **Flag-Gated**: Telemetry is disabled by default and only enabled when `NEXT_PUBLIC_GLOW_TELEMETRY_CSRF` is set to `'1'`. This ensures no performance impact in production.
- **Sampling**: A 10% deterministic sampling rate is used to minimize the volume of telemetry data.
- **Minimal Overhead**: The telemetry code is designed to have minimal performance impact on the application.

## Event Details
- **`bd_csrf_auto_recover_start`**: Fired when CSRF auto-recovery is initiated.
- **`bd_csrf_rotate_200` / `bd_csrf_rotate_401` / `bd_csrf_rotate_5xx`**: Fired after the CSRF token refresh attempt, indicating success or failure.
- **`bd_csrf_auto_recover_success` / `bd_csrf_auto_recover_fail`**: Fired after the retry attempt, indicating the final outcome of the auto-recovery process.

## Operational Guardrails
- **Console Only**: Logs are sent to the browser console only. No data is sent to external services.
- **Investigation Tool**: This telemetry is intended for targeted investigations, not for continuous monitoring.
- **Single-Commit Revert**: The entire feature can be reverted with a single commit.

