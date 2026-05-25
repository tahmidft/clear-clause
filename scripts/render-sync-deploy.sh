#!/usr/bin/env bash
# Sync backend/.env to Render clearclause-api and trigger a production deploy.
# Requires RENDER_API_KEY (Account Settings → API Keys) or RENDER_DEPLOY_HOOK_URL.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
SERVICE_NAME="${RENDER_SERVICE_NAME:-clearclause-api}"
VERCEL_ORIGIN="${VERCEL_PRODUCTION_ORIGIN:-https://clearclause.vercel.app}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ -n "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "==> Triggering Render deploy via hook"
  curl -fsS -X POST "${RENDER_DEPLOY_HOOK_URL}"
  echo
  echo "Deploy triggered. Waiting for health (up to 5 min, cold starts ~60–90s)…"
  for _ in $(seq 1 30); do
    if curl -fsS -m 60 "https://${SERVICE_NAME}.onrender.com/health" 2>/dev/null; then
      echo
      exit 0
    fi
    sleep 10
  done
  echo "Health check still failing — check Render dashboard (status, logs, Manual Deploy)." >&2
  exit 1
fi

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo "Set RENDER_API_KEY or RENDER_DEPLOY_HOOK_URL, then re-run:" >&2
  echo "  export RENDER_API_KEY=rnd_…" >&2
  echo "  bash scripts/render-sync-deploy.sh" >&2
  exit 1
fi

api() {
  curl -fsS "$@" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json"
}

echo "==> Resolving Render service ${SERVICE_NAME}"
services_json="$(api "https://api.render.com/v1/services?limit=100")"
service_id="$(echo "${services_json}" | python3 -c "
import json, sys, os
name = os.environ['SERVICE_NAME']
for item in json.load(sys.stdin):
    s = item.get('service') or item
    if s.get('name') == name:
        print(s['id'])
        break
" SERVICE_NAME="${SERVICE_NAME}")"

if [[ -z "${service_id}" ]]; then
  echo "Service '${SERVICE_NAME}' not found on Render." >&2
  exit 1
fi

echo "==> Service id: ${service_id}"

cors="${CORS_ORIGINS:-${VERCEL_ORIGIN}}"
cors="${cors},http://localhost:5173,http://127.0.0.1:5173"

for key in GEMINI_API_KEY SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DATABASE_URL; do
  val="${!key:-}"
  if [[ -z "${val}" ]]; then
    echo "Missing ${key} in backend/.env" >&2
    exit 1
  fi
done

echo "==> Updating Render env (CORS_ORIGINS=${cors})"
export CORS_ORIGINS="${cors}"
export APP_ENV="${APP_ENV:-production}"
payload="$(python3 - <<'PY'
import json, os
keys = [
    "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "CORS_ORIGINS",
    "APP_ENV",
]
env = [{"key": k, "value": os.environ[k]} for k in keys if os.environ.get(k)]
print(json.dumps(env))
PY
)"

api -X PUT "https://api.render.com/v1/services/${service_id}/env-vars" -d "${payload}" >/dev/null

echo "==> Triggering deploy"
api -X POST "https://api.render.com/v1/services/${service_id}/deploys" \
  -d '{"clearCache":"do_not_clear"}' >/dev/null

echo "Deploy started. Waiting for health (cold starts may take ~60–90s)…"
for _ in $(seq 1 30); do
  if curl -fsS -m 60 "https://${SERVICE_NAME}.onrender.com/health" 2>/dev/null; then
    echo
    exit 0
  fi
  sleep 10
done
echo "Health check still failing — check Render dashboard (status, logs, Manual Deploy)." >&2
exit 1
