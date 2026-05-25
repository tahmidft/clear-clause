#!/usr/bin/env bash
# Run a short Gemini analysis on the sample contract text.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"
exec .venv/bin/python - <<'PY'
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(".env")
if not os.getenv("GEMINI_API_KEY"):
    print("ERROR: GEMINI_API_KEY not set in backend/.env")
    sys.exit(1)

from services.gemini import analyze_contract

text = Path("../samples/freelance-design-contract-sample.txt").read_text()
prefs = {
    "unpaid_revisions": False,
    "payment_terms_days": 30,
    "ip_ownership": True,
    "non_compete": False,
    "termination_notice_days": 14,
    "max_revision_rounds": 3,
    "requires_deposit": True,
    "min_deposit_percent": 25,
    "liability_cap_required": True,
    "accepts_broad_indemnification": False,
    "kill_fee_required": True,
    "written_scope_required": True,
}
print("==> Running Gemini analysis (typically 5–30s with flash-lite)...")
import signal

def _timeout_handler(*_):
    raise TimeoutError("Gemini smoke test exceeded 90s")

signal.signal(signal.SIGALRM, _timeout_handler)
signal.alarm(90)
try:
    result = analyze_contract(text, prefs)
finally:
    signal.alarm(0)
print("==> OK")
print("  sections:", len(result.get("sections", [])))
print("  score:", result.get("overall_score"))
print("  recommendation:", result.get("recommendation"))
print("  conflicts:", len(result.get("preference_conflicts", [])))
PY
