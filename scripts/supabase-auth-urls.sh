#!/usr/bin/env bash
# Set Supabase Auth Site URL and redirect allow-list for ClearClause production + local dev.
# Requires SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens) or `supabase login`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
SITE_URL="${SUPABASE_SITE_URL:-https://clearclause.vercel.app}"
# Newline-separated redirect patterns (Supabase uri_allow_list format)
REDIRECTS="${SUPABASE_REDIRECT_URLS:-$(
  cat <<EOF
${SITE_URL}/**
https://frontend-teal-ten-82.vercel.app/**
http://localhost:5173/**
http://127.0.0.1:5173/**
EOF
)}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Set SUPABASE_ACCESS_TOKEN (Account → Access Tokens), then re-run:" >&2
  echo "  export SUPABASE_ACCESS_TOKEN=sbp_…" >&2
  echo "  bash scripts/supabase-auth-urls.sh" >&2
  exit 1
fi

if [[ -z "${SUPABASE_URL:-}" ]]; then
  echo "SUPABASE_URL missing — add it to backend/.env" >&2
  exit 1
fi

project_ref="$(python3 - <<'PY'
import os, re
url = os.environ["SUPABASE_URL"].rstrip("/")
m = re.search(r"https://([^.]+)\.supabase\.co", url)
if not m:
    raise SystemExit("Could not parse project ref from SUPABASE_URL")
print(m.group(1))
PY
)"

api() {
  curl -fsS "$@" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json"
}

echo "==> Updating Supabase auth URLs for project ${project_ref}"
echo "    Site URL: ${SITE_URL}"

payload="$(python3 - <<'PY'
import json, os
redirects = os.environ["REDIRECTS"].strip().splitlines()
payload = {
    "site_url": os.environ["SITE_URL"],
    "uri_allow_list": "\n".join(redirects),
}
print(json.dumps(payload))
PY
)"

api -X PATCH "https://api.supabase.com/v1/projects/${project_ref}/config/auth" \
  -d "${payload}" >/dev/null

echo "==> Auth URL configuration updated."
