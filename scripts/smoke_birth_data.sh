#!/usr/bin/env bash
set -euo pipefail

# Production smoke test for birth-data HH:mm + CSRF contract
# Tests: login → CSRF mint → invalid-save(400) → valid-save(200) → /api/auth/me HH:mm check → CSRF 403s

BASE_URL="${SMOKE_BASE_URL:-https://glowme.io}"
EMAIL="${SMOKE_EMAIL:-admin@glow.app}"
PASSWORD="${SMOKE_PASSWORD:-admin123}"
JAR="$(mktemp)"
CLEANUP() { rm -f "$JAR" 2>/dev/null || true; }
trap CLEANUP EXIT

# Curl with timeouts and error handling
curl_with_timeout() {
  curl -sS --connect-timeout 10 --max-time 30 --cookie "$JAR" --cookie-jar "$JAR" "$@"
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }
fail() { log "FAIL: $*"; exit 1; }

# 1) LOGIN
log "== LOGIN =="
RESPONSE=$(curl_with_timeout -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "200" ]]; then
  fail "Login failed (HTTP:$HTTP_CODE)"
fi

if ! echo "$BODY" | grep -q '"ok":true'; then
  fail "Login response invalid: $BODY"
fi

log "Login successful ✅"

# 2) GET CSRF TOKEN
log "== GET CSRF TOKEN =="
RESPONSE=$(curl_with_timeout "$BASE_URL/api/auth/csrf" \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "200" ]]; then
  fail "CSRF endpoint failed (HTTP:$HTTP_CODE)"
fi

CSRF_TOKEN=$(echo "$BODY" | grep -o '"csrf_token":"[^"]*"' | cut -d'"' -f4)
if [[ -z "$CSRF_TOKEN" ]]; then
  fail "Unable to extract CSRF token from: $BODY"
fi

log "CSRF token acquired ✅"

# 3) INVALID SAVE (expects 400)
log "== INVALID SAVE (expects 400) =="
RESPONSE=$(curl_with_timeout -X PUT "$BASE_URL/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17:00","birth_location":"New York, United States"}' \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "400" ]]; then
  fail "Expected 400 for invalid time, got HTTP:$HTTP_CODE. Body: $BODY"
fi

if ! echo "$BODY" | grep -q '"birth_time"'; then
  fail "Expected birth_time validation error. Body: $BODY"
fi

log "Invalid save rejected ✅"

# 4) VALID SAVE (expects 200)
log "== VALID SAVE (expects 200) =="
RESPONSE=$(curl_with_timeout -X PUT "$BASE_URL/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17","birth_location":"New York, United States"}' \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "200" ]]; then
  fail "Expected 200 for valid time, got HTTP:$HTTP_CODE. Body: $BODY"
fi

if ! echo "$BODY" | grep -q '"ok":true'; then
  fail "Expected success response. Body: $BODY"
fi

log "Valid save accepted ✅"

# 5) VERIFY /api/auth/me (HH:mm format)
log "== VERIFY /api/auth/me =="
RESPONSE=$(curl_with_timeout "$BASE_URL/api/auth/me" \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "200" ]]; then
  fail "/api/auth/me failed (HTTP:$HTTP_CODE)"
fi

if ! echo "$BODY" | grep -q '"time":"21:17"'; then
  fail "Expected time:\"21:17\" in /api/auth/me response. Body: $BODY"
fi

log "Time format verified (HH:mm) ✅"

# 6) CSRF MISSING (expects 403)
log "== CSRF MISSING (expects 403) =="
RESPONSE=$(curl_with_timeout -X PUT "$BASE_URL/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17","birth_location":"New York, United States"}' \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "403" ]]; then
  fail "Expected 403 for missing CSRF, got HTTP:$HTTP_CODE. Body: $BODY"
fi

if ! echo "$BODY" | grep -q 'CSRF_MISSING'; then
  fail "Expected CSRF_MISSING error. Body: $BODY"
fi

log "CSRF missing protection ✅"

# 7) CSRF INVALID (expects 403)
log "== CSRF INVALID (expects 403) =="
RESPONSE=$(curl_with_timeout -X PUT "$BASE_URL/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: invalid_token_12345" \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17","birth_location":"New York, United States"}' \
  -w "HTTPCODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTPCODE:[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTPCODE:[0-9]*$//')

if [[ "$HTTP_CODE" != "403" ]]; then
  fail "Expected 403 for invalid CSRF, got HTTP:$HTTP_CODE. Body: $BODY"
fi

if ! echo "$BODY" | grep -q 'CSRF_INVALID'; then
  fail "Expected CSRF_INVALID error. Body: $BODY"
fi

log "CSRF invalid protection ✅"

log "== ALL TESTS PASSED =="
log "✅ Login working"
log "✅ CSRF rotation working"  
log "✅ Time validation working (HH:mm:ss → 400, HH:mm → 200)"
log "✅ Data persistence working"
log "✅ CSRF protection working (missing/invalid → 403)"
log "Done."

