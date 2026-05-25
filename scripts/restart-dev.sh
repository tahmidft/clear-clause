#!/usr/bin/env bash
# Restart local API (:8000) and Vite (:5173). Waits for both to respond.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Restarting API..."
bash "${ROOT}/scripts/restart-local-api.sh"

echo "==> Restarting Vite..."
pkill -f '[v]ite' 2>/dev/null || true
pkill -f 'node.*vite' 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k 5173/tcp 2>/dev/null || true
fi
sleep 0.5

cd "${ROOT}/frontend"
nohup npm run dev >>/tmp/clearclause-vite.log 2>&1 &
echo $! >/tmp/clearclause-vite.pid
echo "==> vite pid $(cat /tmp/clearclause-vite.pid), log /tmp/clearclause-vite.log"

for _ in $(seq 1 40); do
  if curl -sfS --max-time 2 "http://127.0.0.1:5173/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! curl -sfS --max-time 2 "http://127.0.0.1:5173/" >/dev/null 2>&1; then
  echo "ERROR: Vite did not become ready on http://127.0.0.1:5173/"
  exit 1
fi

echo "==> Dev services restarted"
echo "    Frontend: http://localhost:5173"
echo "    API:      http://127.0.0.1:8000"
