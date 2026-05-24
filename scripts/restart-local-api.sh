#!/usr/bin/env bash
# Stop anything on :8000, start the FastAPI app in the background, wait for /health, run verify-local-api.sh.
# Logs: /tmp/clearclause-uvicorn.log   PID: /tmp/clearclause-uvicorn.pid
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"

if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "ERROR: ${ROOT}/backend/.venv/bin/uvicorn not found. Create the venv and pip install -r requirements.txt."
  exit 1
fi

pkill -f '[u]vicorn main:app' 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k 8000/tcp 2>/dev/null || true
fi
sleep 0.5

nohup .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000 >>/tmp/clearclause-uvicorn.log 2>&1 &
echo $! >/tmp/clearclause-uvicorn.pid
echo "==> uvicorn pid $(cat /tmp/clearclause-uvicorn.pid), log /tmp/clearclause-uvicorn.log"

for _ in $(seq 1 40); do
  if curl -sfS --max-time 2 "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

exec bash "${ROOT}/scripts/verify-local-api.sh"
