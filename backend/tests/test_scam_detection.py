"""Tests for rule-based scam detection."""

from services.scam_detection import analyze_scam_risk, merge_scam_into_analysis


GOOD_SNIPPET = """
INDEPENDENT CONTRACTOR AGREEMENT between Bright Harbor Studio Inc., 1200 Pine Street, Seattle, WA
and Morgan Chen. Net fifteen (15) days. Deposit thirty percent via ACH to contractor business account.
Two revision rounds. Liability capped at fees paid. Thirty days termination notice.
"""

BAD_SNIPPET = """
Northwind Labs LLC, 500 Market Street, San Francisco, CA and Alex Rivera.
Payment within ninety (90) days. Unlimited revision rounds. Work made for hire. Twelve month non-compete.
"""

SCAM_SNIPPET = """
Global Brand Nexus branddirector.nexus@gmail.com
Contractor must pay onboarding fee $750 via Bitcoin before brief.
Passport scan and Social Security Number and online banking login required.
Sign by replying YES. No countersignature until fee received. Gift cards or crypto only.
48 hours to deliver or $2000 penalty.
"""


def test_good_contract_low_scam_risk():
    r = analyze_scam_risk(GOOD_SNIPPET)
    assert r["likely_scam"] is False
    assert r["scam_risk"] == "low"
    assert r["scam_score"] < 10


def test_bad_contract_not_classified_as_scam():
    r = analyze_scam_risk(BAD_SNIPPET)
    assert r["likely_scam"] is False
    assert r["scam_risk"] in ("low", "medium")


def test_scam_contract_high_risk():
    r = analyze_scam_risk(SCAM_SNIPPET)
    assert r["likely_scam"] is True
    assert r["scam_risk"] == "high"
    assert len(r["scam_signals"]) >= 3


def test_merge_filters_meta_signals():
    analysis = {
        "overall_score": 80,
        "recommendation": "accept",
        "recommendation_reason": "Looks fine",
        "scam_signals": ["labeled as scam document for demos"],
        "likely_scam": True,
        "scam_risk": "high",
        "preference_conflicts": [],
        "sections": [],
    }
    out = merge_scam_into_analysis(analysis, SCAM_SNIPPET)
    assert out["likely_scam"] is True
    assert not any("demo" in s.lower() for s in out["scam_signals"])
    assert out["recommendation"] == "reject"
