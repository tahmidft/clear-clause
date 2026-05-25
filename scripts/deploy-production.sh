#!/usr/bin/env bash
# Production deploy: Vercel frontend + optional Render API sync/deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

echo "==> Vercel production (frontend/)"
(cd frontend && vercel --prod --yes)

if [[ -n "${RENDER_API_KEY:-}" || -n "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  bash "${ROOT}/scripts/render-sync-deploy.sh"
else
  echo "==> Skipping Render (set RENDER_API_KEY or RENDER_DEPLOY_HOOK_URL to sync API)"
fi

echo "==> Production URLs"
FRONTEND_URL="${VERCEL_PRODUCTION_ORIGIN:-https://clearclause.vercel.app}"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Frontend (Vercel alias): https://frontend-teal-ten-82.vercel.app"
echo "  API:      \${RENDER_HEALTH_URL:-https://clearclause-api-ma86.onrender.com/health}"
