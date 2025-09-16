#!/usr/bin/env bash
set -euo pipefail

# --- CONFIG ---
BASE="https://www.glowme.io"
EMAIL="admin@glow.app"
PASS="admin123"
JAR="$(mktemp)"
echo "Using cookie jar: $JAR"

# --- 1) LOGIN (sets glow_session + glow_csrf) ---
echo "== LOGIN =="
curl -sS -c "$JAR" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | jq . 2>/dev/null || echo "Login response received"

# --- 2) GET/CONFIRM CSRF TOKEN (idempotent) ---
echo "== GET CSRF TOKEN =="
CSRF_JSON="$(mktemp)"
curl -sS -b "$JAR" -c "$JAR" "$BASE/api/auth/csrf" | tee "$CSRF_JSON" | jq . 2>/dev/null || cat "$CSRF_JSON"
# Prefer JSON token; fallback to cookie if jq not present/field missing
if command -v jq >/dev/null 2>&1; then
  CSRF="$(jq -r '.csrf_token // empty' "$CSRF_JSON")"
fi
if [ -z "${CSRF:-}" ]; then
  CSRF="$(grep -E '\sglow_csrf\s' "$JAR" | tail -n1 | awk '{print $7}')"
fi
echo "CSRF token: ${CSRF:0:6}…"

# --- 3) INVALID SAVE (seconds present) -> 400 validation_error ---
echo "== INVALID SAVE (expects 400) =="
curl -sS -o /dev/stderr -w "\nHTTP:%{http_code}\n" \
  -b "$JAR" -X PUT "$BASE/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17:00","birth_location":"New York, United States"}'

# --- 4) VALID SAVE (HH:mm) -> 200 ---
echo "== VALID SAVE (expects 200) =="
curl -sS -o /dev/stderr -w "\nHTTP:%{http_code}\n" \
  -b "$JAR" -X PUT "$BASE/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17","birth_location":"New York, United States"}'

# --- 5) VERIFY VIA /api/auth/me (HH:mm) ---
echo "== VERIFY /api/auth/me =="
curl -sS -b "$JAR" "$BASE/api/auth/me" | jq '.user.birth_data' 2>/dev/null || curl -sS -b "$JAR" "$BASE/api/auth/me" | grep -A 10 '"birth_data"'

# --- 6) CSRF NEGATIVE: MISSING HEADER -> 403 (CSRF_MISSING) ---
echo "== CSRF MISSING (expects 403) =="
curl -sS -o /dev/stderr -w "\nHTTP:%{http_code}\n" \
  -b "$JAR" -X PUT "$BASE/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17","birth_location":"New York, United States"}'

# --- 7) CSRF NEGATIVE: BAD TOKEN -> 403 (CSRF_INVALID) ---
echo "== CSRF INVALID (expects 403) =="
curl -sS -o /dev/stderr -w "\nHTTP:%{http_code}\n" \
  -b "$JAR" -X PUT "$BASE/api/profile/birth-data" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: not_the_right_token" \
  --data '{"birth_date":"1990-05-15","birth_time":"21:17","birth_location":"New York, United States"}'

echo "Done."

