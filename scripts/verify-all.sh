#!/usr/bin/env bash
# Local smoke checks: API, database, storage, Gemini.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "==> API + CORS"
bash "${ROOT}/scripts/verify-local-api.sh"
echo "==> Database"
bash "${ROOT}/scripts/verify-database.sh"
echo "==> Storage"
bash "${ROOT}/scripts/verify-storage.sh"
echo "==> Gemini analysis"
bash "${ROOT}/scripts/verify-gemini.sh"
echo "==> All local verification passed."
