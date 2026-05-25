"""
Rule-based freelance contract scam detection (ClearClause).

Runs deterministic pattern matching and weighted scoring on contract text.
Gemini handles clause analysis; this engine owns fraud/scam classification.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

ScamRisk = Literal["low", "medium", "high"]

# Ignore AI/meta phrases that are not real contract red flags.
_META_SIGNAL_RE = re.compile(
    r"clearclause|demo\s+only|test\s+sample|sample\s+(document|contract|scam)|"
    r"for\s+demos|not\s+legal\s+advice|fictional|pattern\s+document",
    re.I,
)

# Legitimate LLC/Inc markers reduce false positives on harsh but real deals.
_LEGIT_ENTITY_RE = re.compile(
    r"\b(LLC|L\.L\.C\.|Inc\.|Incorporated|Ltd\.|Limited|Corp\.|Corporation|"
    r"Company|Co\.|GmbH|PLC)\b",
    re.I,
)

_STREET_ADDRESS_RE = re.compile(
    r"\b\d{1,5}\s+[\w\s]{2,40}(Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|"
    r"Drive|Dr\.|Lane|Ln\.|Way|Parkway|Pkwy\.)\b",
    re.I,
)


@dataclass(frozen=True)
class ScamRule:
    id: str
    label: str
    weight: int
    pattern: re.Pattern[str]


# Higher weight = stronger fraud indicator. Bad-but-legitimate contracts should stay below ~20.
_RULES: tuple[ScamRule, ...] = (
    ScamRule(
        "contractor_pays_client",
        "Requires contractor to pay client before work begins",
        28,
        re.compile(
            r"contractor\s+(?:must|shall)\s+pay|pay(?:ment)?\s+(?:due|required)\s+from\s+contractor|"
            r"onboarding\s+(?:fee|payment).{0,80}(?:contractor|freelancer)\s+(?:must|shall)\s+pay|"
            r"refundable\s+(?:onboarding|verification)\s+fee.{0,60}(?:contractor|before\s+any)",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "crypto_upfront",
        "Upfront payment demanded via cryptocurrency or personal wallet",
        26,
        re.compile(
            r"(?:bitcoin|btc|ethereum|eth|usdt|tether|crypto(?:currency)?|gift\s+card).{0,120}"
            r"(?:before|prior\s+to|upfront|onboarding|must\s+pay|payable\s+to\s+wallet)|"
            r"wallet\s+(?:address|bc1|[13][a-km-zA-HJ-NP-Z1-9]{25,})",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "credential_harvest",
        "Requests sensitive credentials (SSN, banking login, passport for screening)",
        25,
        re.compile(
            r"social\s+security|ssn|mother'?s\s+maiden|banking\s+login|online\s+banking\s+password|"
            r"passport\s+scan.{0,40}(?:required|provide)|login\s+credentials",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "crypto_only_payout",
        "Payment only via crypto, gift cards, or informal channels",
        18,
        re.compile(
            r"payment\s+(?:only|via|in)\s+(?:bitcoin|crypto|gift\s+card|usdt)|"
            r"balance\s+paid\s+in\s+(?:gift\s+cards|crypto)",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "no_escrow_ach",
        "No standard business payment rails (ACH/invoice) for large engagement",
        14,
        re.compile(
            r"no\s+(?:ach|escrow|invoice|wire\s+to\s+business)|"
            r"no\s+company\s+invoice\s+available",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "anonymous_client",
        "Client identity vague or only personal email contact",
        12,
        re.compile(
            r"(?:gmail|yahoo|hotmail|protonmail|outlook)\.com|"
            r"no\s+registered\s+address|cannot\s+name\s+(?:client|company)\s+until|"
            r"fortune\s+500\s+client\s+we\s+cannot\s+name",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "impossible_deadline",
        "Impossible delivery timeline with financial penalty",
        16,
        re.compile(
            r"(?:48|72)\s*hours?.{0,80}(?:deliver|complete|void|penalty|\$\d)|"
            r"within\s+(?:forty-eight|seventy-two|48|72)\s+hours",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "email_only_signature",
        "Binding agreement via email reply without proper execution",
        14,
        re.compile(
            r"sign\s+by\s+replying|typed\s+name\s+constitutes\s+binding|"
            r"no\s+countersignature.{0,40}(?:until|before\s+fee)",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "secrecy_penalty",
        "Forbidden to consult lawyers with steep liquidated damages",
        12,
        re.compile(
            r"may\s+not\s+discuss.{0,40}(?:lawyer|attorney)|"
            r"liquidated\s+damages.{0,30}\$?\s*50[,\s]?000",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "urgency_pressure",
        "High-pressure urgency to send money or sign immediately",
        8,
        re.compile(
            r"effective\s+immediately\s+upon\s+(?:wire|payment)|urgent\s+global|"
            r"selected\s+for\s+an\s+exclusive.{0,40}immediately",
            re.I | re.S,
        ),
    ),
    ScamRule(
        "ip_grab_unpaid",
        "All IP assigned immediately with payment contingent or absent",
        10,
        re.compile(
            r"belongs\s+to.{0,30}immediately\s+upon\s+creation.{0,40}no\s+payment\s+required|"
            r"waives\s+all\s+moral\s+rights\s+worldwide\s+in\s+perpetuity",
            re.I | re.S,
        ),
    ),
)

# Harsh terms that are NOT scams — penalize scam score if only these appear without fraud patterns.
_HARSH_NON_SCAM_RE = re.compile(
    r"net\s+(?:sixty|ninety|60|90)|unlimited\s+revision|work\s+made\s+for\s+hire|"
    r"non-compete|indemnif",
    re.I,
)


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _filter_signals(signals: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for s in signals:
        t = s.strip()
        if not t or _META_SIGNAL_RE.search(t):
            continue
        key = t.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(t)
    return out


def _risk_from_score(score: int, critical_hits: int) -> tuple[bool, ScamRisk]:
    if score >= 40 or critical_hits >= 2:
        return True, "high"
    if score >= 28 or (critical_hits >= 1 and score >= 18):
        return True, "medium" if score < 40 else "high"
    if score >= 12:
        return False, "medium"
    return False, "low"


def analyze_scam_risk(contract_text: str) -> dict:
    """
    Run ClearClause scam heuristics. Returns likely_scam, scam_risk, scam_signals, scam_score.
    """
    text = contract_text or ""
    normalized = _normalize_text(text)
    lowered = normalized.lower()

    matched: list[tuple[ScamRule, re.Match[str]]] = []
    for rule in _RULES:
        m = rule.pattern.search(text)
        if m:
            matched.append((rule, m))

    critical_ids = {
        "contractor_pays_client",
        "crypto_upfront",
        "credential_harvest",
    }
    critical_hits = sum(1 for r, _ in matched if r.id in critical_ids)

    score = sum(r.weight for r, _ in matched)

    # Legitimacy dampeners: registered company + street address without critical fraud hits
    has_entity = bool(_LEGIT_ENTITY_RE.search(text))
    has_address = bool(_STREET_ADDRESS_RE.search(text))
    if has_entity and has_address and critical_hits == 0:
        score = max(0, score - 18)
    elif has_entity and critical_hits == 0:
        score = max(0, score - 8)

    # Pure harsh-contract language without fraud patterns
    if score < 25 and _HARSH_NON_SCAM_RE.search(text) and critical_hits == 0:
        score = min(score, 8)

    signals = [rule.label for rule, _ in matched]
    signals = _filter_signals(signals)

    likely, risk = _risk_from_score(score, critical_hits)

    # Medium risk without likely_scam still surfaces signals for UI
    if not signals and score == 0:
        risk = "low"
        likely = False

    return {
        "likely_scam": likely,
        "scam_risk": risk,
        "scam_signals": signals,
        "scam_score": score,
    }


def merge_scam_into_analysis(analysis: dict, contract_text: str) -> dict:
    """Apply engine results; strip weak AI scam claims; enforce reject on confirmed scam."""
    engine = analyze_scam_risk(contract_text)
    ai_signals = analysis.get("scam_signals") or []
    if isinstance(ai_signals, list):
        merged_signals = _filter_signals([str(x) for x in ai_signals] + engine["scam_signals"])
    else:
        merged_signals = engine["scam_signals"]

    # Engine is source of truth for classification
    analysis["likely_scam"] = engine["likely_scam"]
    analysis["scam_risk"] = engine["scam_risk"]
    analysis["scam_signals"] = merged_signals[:12]

    if engine["likely_scam"]:
        analysis["recommendation"] = "reject"
        if engine["scam_risk"] == "high":
            analysis["overall_score"] = min(analysis.get("overall_score", 0), 15)
        else:
            analysis["overall_score"] = min(analysis.get("overall_score", 0), 35)
        reason = analysis.get("recommendation_reason") or ""
        if "scam" not in reason.lower() and "fraud" not in reason.lower():
            analysis["recommendation_reason"] = (
                f"{reason} ClearClause's fraud detection flagged serious scam indicators — do not pay "
                "upfront fees or share credentials."
            ).strip()

    return analysis
