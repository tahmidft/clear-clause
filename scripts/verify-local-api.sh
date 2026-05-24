#!/usr/bin/env bash
# Verify the ClearClause API is reachable and allows browser CORS from local Vite origins.
# Usage: from repo root — bash scripts/verify-local-api.sh
#        API base overrides: CLEARCLAUSE_API_URL=http://localhost:8000 bash scripts/verify-local-api.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_ENV="${ROOT}/frontend/.env"

api_base_from_env_file() {
  if [[ -f "${FRONTEND_ENV}" ]]; then
    # shellcheck disable=SC2002
    grep -E '^[[:space:]]*VITE_API_URL=' "${FRONTEND_ENV}" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/[[:space:]]*$//' | sed 's/^["'\'']//;s/["'\'']$//' || true
  fi
}

API_URL="${CLEARCLAUSE_API_URL:-}"
if [[ -z "${API_URL}" ]]; then
  API_URL="$(api_base_from_env_file)"
fi
if [[ -z "${API_URL}" ]]; then
  API_URL="http://127.0.0.1:8000"
fi
# strip trailing slash
API_URL="${API_URL%/}"

echo "==> Using API base: ${API_URL}"

echo "==> GET ${API_URL}/health"
health_json="$(curl -sfS --max-time 10 "${API_URL}/health")"
echo "${health_json}" | grep -q '"status"' || {
  echo "ERROR: health response missing expected JSON"
  exit 1
}
echo "    health OK (${health_json})"

# Alternate loopback hostname (browser may use localhost vs 127.0.0.1)
if [[ "${API_URL}" == *"127.0.0.1"* ]]; then
  ALT_URL="${API_URL//127.0.0.1/localhost}"
else
  ALT_URL="${API_URL//localhost/127.0.0.1}"
fi
if [[ "${ALT_URL}" != "${API_URL}" ]]; then
  echo "==> GET ${ALT_URL}/health"
  curl -sfS --max-time 10 "${ALT_URL}/health" | grep -q '"status"' || {
    echo "ERROR: health failed on alternate loopback URL"
    exit 1
  }
  echo "    alternate loopback OK"
fi

check_preflight() {
  local origin="$1"
  local dump
  dump="$(curl -sS --max-time 10 -D - -o /dev/null -X OPTIONS \
    -H "Origin: ${origin}" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization" \
    "${API_URL}/contracts")" || true
  if echo "${dump}" | tr -d '\r' | grep -qi 'access-control-allow-origin'; then
    echo "    CORS preflight OK for Origin ${origin}"
    return 0
  fi
  echo "ERROR: CORS preflight for Origin ${origin} — no Access-Control-Allow-Origin in response"
  echo "${dump}" | head -20
  return 1
}

echo "==> CORS preflight OPTIONS ${API_URL}/contracts"
check_preflight "http://127.0.0.1:5173"
check_preflight "http://localhost:5173"

echo "==> All API checks passed."
