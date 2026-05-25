#!/usr/bin/env bash
# Verify backend DATABASE_URL can reach Supabase Postgres.
# Usage: bash scripts/verify-database.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"

if [[ ! -x .venv/bin/python ]]; then
  echo "ERROR: backend/.venv not found. pip install -r requirements.txt in backend/"
  exit 1
fi

exec .venv/bin/python - <<'PY'
import os
import re
import socket
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(".env")
from db.database import _normalize_database_url

raw = os.environ.get("DATABASE_URL", "").strip()
if not raw:
    print("ERROR: DATABASE_URL is not set in backend/.env")
    sys.exit(1)

url = _normalize_database_url(raw)
if url != raw:
    print("NOTE: DATABASE_URL was normalized (brackets/sslmode).")

# Redact password for logs
safe = re.sub(r":([^:@/]+)@", ":***@", url, count=1)
print(f"==> Testing: {safe}")

host_match = re.search(r"@([^/:?]+)", url)
host = host_match.group(1) if host_match else ""
if host:
    try:
        infos = socket.getaddrinfo(host, 5432, type=socket.SOCK_STREAM)
        families = sorted({"IPv4" if i[0] == socket.AF_INET else "IPv6" for i in infos})
        print(f"==> DNS for {host}: {', '.join(families)}")
        if families == ["IPv6"]:
            print(
                "WARN: Host resolves to IPv6 only. If connection fails, use the pooler URI from "
                "Supabase Dashboard → Connect (aws-0-<region>.pooler.supabase.com)."
            )
    except socket.gaierror as e:
        print(f"WARN: Could not resolve {host}: {e}")

REQUIRED = {
    "preferences": [
        "max_revision_rounds",
        "requires_deposit",
        "min_deposit_percent",
        "liability_cap_required",
        "accepts_broad_indemnification",
        "kill_fee_required",
        "written_scope_required",
    ],
    "analyses": ["likely_scam", "scam_risk", "scam_signals"],
}

try:
    engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 12})
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("==> Database connection OK")
    missing_any = False
    with engine.connect() as conn:
        for table, cols in REQUIRED.items():
            rows = conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema='public' AND table_name=:t"
                ),
                {"t": table},
            ).fetchall()
            present = {r[0] for r in rows}
            missing = [c for c in cols if c not in present]
            if missing:
                missing_any = True
                print(f"ERROR: {table} missing columns: {', '.join(missing)}")
    if missing_any:
        print(
            "  Fix: Supabase Dashboard → SQL Editor → run "
            "supabase/migrations/20260524_scam_and_preferences.sql"
        )
        sys.exit(1)
    print("==> Schema columns OK")
except Exception as exc:
    msg = str(exc)
    print("ERROR: Database connection failed")
    if "Network is unreachable" in msg or "2600:" in msg:
        print(
            "  Likely cause: IPv6-only direct host on an IPv4-only network.\n"
            "  Fix: Supabase Dashboard → Connect → copy **Transaction pooler** URI into DATABASE_URL.\n"
            "  Example host: aws-0-<your-region>.pooler.supabase.com port 6543\n"
            "  Username format: postgres.<project-ref>"
        )
    elif "password authentication failed" in msg.lower():
        print("  Likely cause: wrong password in DATABASE_URL.")
        print("  Fix: reset DB password in Supabase → Database settings, URL-encode special chars.")
    elif "Tenant or user not found" in msg or "tenant" in msg.lower():
        print("  Likely cause: wrong pooler region or username (use postgres.<project-ref>).")
    else:
        print(f"  {msg.split(chr(10))[0][:200]}")
    sys.exit(1)
PY
