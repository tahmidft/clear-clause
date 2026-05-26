#!/usr/bin/env bash
# Production deploy: Vercel frontend + optional Render API sync/deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

echo "==> Vercel production (frontend/) — remote build so VITE_* secrets are inlined"
DEPLOY_URL="$(cd frontend && npx vercel deploy --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://clearclause-[a-z0-9]+-tahmidfts-projects\.vercel\.app' | tail -1)"
if [[ -n "${DEPLOY_URL}" ]]; then
  echo "==> Alias clearclause.vercel.app → ${DEPLOY_URL}"
  (cd frontend && npx vercel alias set "${DEPLOY_URL#https://}" clearclause.vercel.app) || true
fi

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
