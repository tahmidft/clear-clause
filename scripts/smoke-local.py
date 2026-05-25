#!/usr/bin/env python3
"""End-to-end local smoke test (no browser). Run from repo root."""
from __future__ import annotations

import sys
import time
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv

load_dotenv(BACKEND / ".env")

FAILURES: list[str] = []


def ok(msg: str) -> None:
    print(f"  OK  {msg}")


def fail(msg: str) -> None:
    print(f"  FAIL {msg}")
    FAILURES.append(msg)


def step(title: str) -> None:
    print(f"\n==> {title}")


def main() -> int:
    print("ClearClause local smoke test\n")

    step("Config")
    from config import get_settings

    s = get_settings()
    if not s.gemini_api_key:
        fail("GEMINI_API_KEY missing")
    else:
        ok("GEMINI_API_KEY set")
    if not s.supabase_url or not s.supabase_service_role_key:
        fail("Supabase env incomplete")
    else:
        ok("Supabase env set")
    if not s.database_url:
        fail("DATABASE_URL missing")
    else:
        ok("DATABASE_URL set")

    step("Parser (sample DOCX)")
    sample = ROOT / "samples" / "freelance-design-contract-sample.docx"
    if not sample.is_file():
        fail(f"Missing {sample}")
    else:
        from services import parser

        raw = sample.read_bytes()
        try:
            text = parser.extract_text(raw, sample.name)
            if len(text) < 500:
                fail(f"Extracted text too short ({len(text)} chars)")
            else:
                ok(f"extracted {len(text)} chars")
        except Exception as e:
            fail(f"parser: {e}")

    step("Storage upload/delete")
    try:
        from services import storage

        path, url = storage.upload_contract_bytes(
            "smoke-test",
            b"smoke",
            "ping.txt",
            "text/plain",
        )
        storage.delete_contract_object(path)
        ok("storage round-trip")
    except Exception as e:
        fail(f"storage: {e}")

    step("Database")
    try:
        from sqlalchemy import create_engine, text
        from db.database import _normalize_database_url

        engine = create_engine(_normalize_database_url(s.database_url), pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        ok("database connect")
    except Exception as e:
        fail(f"database: {e}")

    step("Gemini analysis (sample contract)")
    try:
        from services.gemini import analyze_contract

        text = (ROOT / "samples" / "freelance-design-contract-sample.txt").read_text()
        prefs = {
            "unpaid_revisions": False,
            "payment_terms_days": 30,
            "ip_ownership": True,
            "non_compete": False,
            "termination_notice_days": 14,
        }
        t0 = time.time()
        result = analyze_contract(text, prefs)
        elapsed = time.time() - t0
        if len(result.get("sections", [])) < 3:
            fail(f"too few sections ({len(result.get('sections', []))})")
        else:
            ok(
                f"{elapsed:.1f}s — score {result.get('overall_score')} "
                f"rec {result.get('recommendation')} "
                f"({len(result.get('sections', []))} sections)"
            )
    except Exception as e:
        fail(f"gemini: {e}")

    step("API health (HTTP)")
    try:
        import httpx

        for base in ("http://127.0.0.1:8000",):
            r = httpx.get(f"{base}/health", timeout=5.0)
            if r.status_code != 200:
                fail(f"GET {base}/health -> {r.status_code}")
            else:
                ok(f"{base}/health")
    except Exception as e:
        fail(f"api health: {e}")

    step("Vite proxy health (if dev server running)")
    try:
        import httpx

        r = httpx.get("http://127.0.0.1:5173/api/health", timeout=5.0)
        if r.status_code == 200:
            ok("localhost:5173/api/health (proxy)")
        else:
            print(f"  skip vite proxy ({r.status_code}) — start frontend with npm run dev")
    except Exception as e:
        print(f"  skip vite proxy — {e}")

    print("\n" + ("=" * 50))
    if FAILURES:
        print(f"FAILED ({len(FAILURES)}):\n")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    print("All smoke checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
