import json
import logging
import re

import google.generativeai as genai
from fastapi import HTTPException
from pydantic import ValidationError

from config import get_settings
from models.schemas import AnalysisResult
from services.scam_detection import merge_scam_into_analysis

logger = logging.getLogger(__name__)

_MODEL_FALLBACKS = (
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
)

_GENERATE_TIMEOUT_SEC = 90
_MAX_CONTRACT_CHARS = 48_000
_LONG_CONTRACT_CHARS = 18_000

DEFAULT_PREFERENCES: dict = {
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


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _normalize_analysis_payload(payload: dict) -> None:
    allowed_risk = {"safe", "caution", "red_flag"}
    sections = payload.get("sections")
    if not isinstance(sections, list):
        payload["sections"] = []
        sections = []
    normalized_sections = []
    for sec in sections:
        if not isinstance(sec, dict):
            continue
        rl = sec.get("risk_level")
        if isinstance(rl, str):
            key = rl.lower().strip().replace(" ", "_").replace("-", "_")
            if key == "redflag":
                key = "red_flag"
            if key not in allowed_risk:
                key = "caution"
            sec["risk_level"] = key
        for field in ("title", "plain_english", "original_text", "risk_reason"):
            if field not in sec or not str(sec.get(field, "")).strip():
                sec[field] = sec.get(field) or "Not specified"
        if "conflicts_with_preference" not in sec:
            sec["conflicts_with_preference"] = False
        normalized_sections.append(sec)
    payload["sections"] = normalized_sections[:12]

    rec = payload.get("recommendation")
    if isinstance(rec, str):
        r = rec.lower().strip()
        payload["recommendation"] = r if r in ("accept", "reject") else "reject"
    pc = payload.get("preference_conflicts")
    if not isinstance(pc, list):
        payload["preference_conflicts"] = []
    else:
        payload["preference_conflicts"] = [str(x) for x in pc]
    score = payload.get("overall_score")
    if isinstance(score, (int, float)):
        payload["overall_score"] = max(0, min(100, int(score)))
    else:
        payload["overall_score"] = 0

    payload["likely_scam"] = False
    payload["scam_risk"] = "low"
    payload["scam_signals"] = []


def _preference_prompt_lines(preferences: dict) -> str:
    p = {**DEFAULT_PREFERENCES, **preferences}
    return f"""- Accepts unpaid revisions: {p["unpaid_revisions"]}
- Maximum revision rounds (flag if unlimited or above this): {p["max_revision_rounds"]}
- Maximum payment terms (net days): {p["payment_terms_days"]}
- Requires upfront deposit: {p["requires_deposit"]} (minimum {p["min_deposit_percent"]}% if required)
- Requires IP ownership by contractor: {p["ip_ownership"]}
- Accepts non-compete clauses: {p["non_compete"]}
- Minimum termination notice (days): {p["termination_notice_days"]}
- Requires liability cap on contractor: {p["liability_cap_required"]}
- Accepts broad indemnification of client: {p["accepts_broad_indemnification"]}
- Requires kill fee on client early termination: {p["kill_fee_required"]}
- Requires written scope of work / SOW: {p["written_scope_required"]}"""


def _extract_json_object(text: str) -> str:
    t = _strip_json_fence(text)
    if t.startswith("{") and t.endswith("}"):
        return t
    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1 and end > start:
        return t[start : end + 1]
    return t


def _model_candidates() -> list[str]:
    s = get_settings()
    primary = (s.gemini_model or "gemini-2.5-flash").strip()
    seen: set[str] = set()
    out: list[str] = []
    for name in (primary, *_MODEL_FALLBACKS):
        if name and name not in seen:
            seen.add(name)
            out.append(name)
    return out


def _response_text(response) -> str:
    try:
        text = (response.text or "").strip()
        if text:
            return text
    except (ValueError, AttributeError):
        pass
    candidates = getattr(response, "candidates", None) or []
    for cand in candidates:
        content = getattr(cand, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", None) or []:
            t = getattr(part, "text", None)
            if t and str(t).strip():
                return str(t).strip()
    return ""


def _generate_with_fallback(prompt: str) -> str:
    s = get_settings()
    genai.configure(api_key=s.gemini_api_key)
    last_error: Exception | None = None

    for model_name in _model_candidates():
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                request_options={"timeout": _GENERATE_TIMEOUT_SEC},
            )
            raw = _response_text(response)
            if raw:
                return raw
            last_error = ValueError("empty response (blocked or no text)")
        except Exception as e:
            last_error = e
            err = str(e).lower()
            if "404" in err or "not found" in err:
                logger.warning("Gemini model %s unavailable, trying fallback", model_name)
                continue
            if "429" in err or "quota" in err or "resourceexhausted" in err:
                logger.warning("Gemini model %s rate limited, trying fallback", model_name)
                continue
            if "timeout" in err or "deadline" in err:
                logger.warning("Gemini model %s timed out, trying fallback", model_name)
                continue
            raise

    if last_error is not None:
        raise last_error
    raise ValueError("No Gemini model produced a response")


def _build_prompt(contract_text: str, preferences: dict, *, compact: bool) -> str:
    pref_lines = _preference_prompt_lines(preferences)
    excerpt = contract_text[:_MAX_CONTRACT_CHARS]
    section_instruction = (
        "Extract at most 8 of the most important sections only (Payment, IP, Termination, Revisions, Liability, Scope)."
        if compact
        else "Extract these sections when present: Payment Terms, IP Rights, Termination, Revision Policy, Non-Compete, Liability, Confidentiality, Scope of Work. Limit to 10 sections."
    )

    return f"""You are a contract analysis expert for freelance and independent contractor agreements. Return ONLY valid JSON (no markdown, no backticks).

User preferences — set conflicts_with_preference and list violations in preference_conflicts:
{pref_lines}

Scoring guidance:
- Fair contracts with reasonable payment (deposit + net ≤30), limited revisions, mutual liability caps, and written SOW: overall_score 72-92, recommendation "accept" if few conflicts.
- Harsh but legitimate corporate contracts (slow payment, broad IP assignment, non-compete): low score and "reject" for preference conflicts — NOT fraud. Do not confuse bad deals with scams.
- Leave likely_scam false, scam_risk "low", scam_signals [] (fraud is detected separately by ClearClause).

{section_instruction}

JSON schema:
{{
  "sections": [
    {{
      "title": "string",
      "plain_english": "string — 2-4 sentences explaining this section in everyday language for a freelancer",
      "original_text": "string — verbatim quote copied from the CONTRACT text for this section (required; never empty or placeholder)",
      "risk_level": "safe | caution | red_flag",
      "risk_reason": "string",
      "conflicts_with_preference": true | false
    }}
  ],
  "overall_score": 0-100,
  "recommendation": "accept | reject",
  "recommendation_reason": "string",
  "preference_conflicts": ["string"],
  "likely_scam": false,
  "scam_risk": "low",
  "scam_signals": []
}}

CONTRACT:
{excerpt}
"""


def _parse_and_validate(raw: str) -> dict:
    try:
        payload = json.loads(_extract_json_object(raw))
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail="Could not read the AI response. Please try again in a moment.",
        ) from e

    _normalize_analysis_payload(payload)
    try:
        validated = AnalysisResult.model_validate(payload)
    except ValidationError as e:
        raise HTTPException(
            status_code=502,
            detail="The AI returned an unexpected format. Please try again.",
        ) from e
    return validated.model_dump()


def analyze_contract(contract_text: str, preferences: dict) -> dict:
    s = get_settings()
    if not s.gemini_api_key:
        raise HTTPException(status_code=500, detail="AI service is not configured")

    compact = len(contract_text) > _LONG_CONTRACT_CHARS
    prompts = [_build_prompt(contract_text, preferences, compact=compact)]
    if compact:
        prompts.append(_build_prompt(contract_text[:_LONG_CONTRACT_CHARS], preferences, compact=True))

    last_http: HTTPException | None = None
    raw = ""
    for prompt in prompts:
        try:
            raw = _generate_with_fallback(prompt)
            result = _parse_and_validate(raw)
            return merge_scam_into_analysis(result, contract_text)
        except HTTPException as exc:
            last_http = exc
            if exc.status_code != 502:
                raise
            logger.warning("Gemini parse/validate failed, %s", exc.detail)

    try:
        raw = _generate_with_fallback(prompts[-1])
    except Exception as e:
        err = str(e).lower()
        if "429" in err or "quota" in err:
            raise HTTPException(
                status_code=502,
                detail="AI quota exceeded. Check Google AI Studio billing or try again later.",
            ) from e
        if "api key" in err or "invalid" in err and "key" in err:
            raise HTTPException(
                status_code=500,
                detail="AI service API key is invalid. Check GEMINI_API_KEY in backend/.env.",
            ) from e
        logger.exception("Gemini analysis failed")
        raise HTTPException(
            status_code=502,
            detail="The AI service could not analyze this contract. Please try again.",
        ) from e

    if last_http:
        raise last_http
    result = _parse_and_validate(raw)
    return merge_scam_into_analysis(result, contract_text)
