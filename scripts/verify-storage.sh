#!/usr/bin/env bash
# Verify Supabase Storage bucket "contracts" and upload permission.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"

if [[ ! -x .venv/bin/python ]]; then
  echo "ERROR: backend/.venv not found"
  exit 1
fi

exec .venv/bin/python - <<'PY'
import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env")
base = os.environ.get("SUPABASE_URL", "").rstrip("/")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not base or not key:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in backend/.env")
    raise SystemExit(1)

headers = {"apikey": key, "Authorization": f"Bearer {key}"}
bucket = "contracts"

with httpx.Client(timeout=20.0) as client:
    r = client.get(f"{base}/storage/v1/bucket", headers=headers)
    if r.status_code != 200:
        print(f"ERROR: list buckets failed ({r.status_code}): {r.text[:200]}")
        raise SystemExit(1)
    buckets = r.json()
    names = [b.get("name") for b in buckets if isinstance(b, dict)]
    if bucket not in names:
        print(f'ERROR: bucket "{bucket}" not found. Create it in Supabase → Storage.')
        print("Existing buckets:", names or "(none)")
        raise SystemExit(1)
    meta = next(b for b in buckets if b.get("name") == bucket)
    public = meta.get("public", False)
    print(f'==> Bucket "{bucket}" exists (public={public})')
    if not public:
        print("WARN: Bucket is private. Set it to Public in the dashboard for file URLs to work.")

    test_path = "healthcheck/.verify-storage"
    up = client.post(
        f"{base}/storage/v1/object/{bucket}/{test_path}",
        headers={**headers, "Content-Type": "text/plain"},
        content=b"ok",
    )
    if up.status_code not in (200, 201):
        print(f"ERROR: test upload failed ({up.status_code}): {up.text[:200]}")
        raise SystemExit(1)
    print("==> Test upload OK")
    client.delete(f"{base}/storage/v1/object/{bucket}/{test_path}", headers=headers)
    print("==> Storage checks passed.")
PY
