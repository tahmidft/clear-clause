#!/usr/bin/env bash
# Restart backend + frontend for local development and run smoke tests.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "${ROOT}/scripts/restart-dev.sh"

echo "==> Smoke test..."
"${ROOT}/backend/.venv/bin/python" "${ROOT}/scripts/smoke-local.py"
echo ""
echo "==> Ready"
echo "    Frontend: http://localhost:5173"
echo "    API:      http://127.0.0.1:8000"
echo "    API log:  /tmp/clearclause-uvicorn.log"
echo "    Vite log: /tmp/clearclause-vite.log"
