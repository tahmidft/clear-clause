import json
import re

import google.generativeai as genai
from fastapi import HTTPException
from pydantic import ValidationError

from config import get_settings
from models.schemas import AnalysisResult


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


def _extract_json_object(text: str) -> str:
    t = _strip_json_fence(text)
    if t.startswith("{") and t.endswith("}"):
        return t
    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1 and end > start:
        return t[start : end + 1]
    return t


def analyze_contract(contract_text: str, preferences: dict) -> dict:
    s = get_settings()
    if not s.gemini_api_key:
        raise HTTPException(status_code=500, detail="AI service is not configured")

    genai.configure(api_key=s.gemini_api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    system_and_prompt = f"""You are a contract analysis expert specializing in freelance contracts. Analyze the contract below and return ONLY a valid JSON object with no markdown, no backticks, no preamble.

User preferences (flag conflicts):
- Accepts unpaid revisions: {preferences.get("unpaid_revisions", False)}
- Maximum payment terms: {preferences.get("payment_terms_days", 30)} days
- Requires IP ownership: {preferences.get("ip_ownership", True)}
- Accepts non-compete: {preferences.get("non_compete", False)}
- Minimum termination notice: {preferences.get("termination_notice_days", 14)} days

Return this exact JSON structure:
{{
  "sections": [
    {{
      "title": "Payment Terms",
      "plain_english": "plain English explanation of what this means",
      "original_text": "exact relevant clause from contract",
      "risk_level": "safe | caution | red_flag",
      "risk_reason": "why this is flagged or why it is safe",
      "conflicts_with_preference": true | false
    }}
  ],
  "overall_score": 0-100,
  "recommendation": "accept | reject",
  "recommendation_reason": "clear 2-3 sentence explanation",
  "preference_conflicts": ["list of specific preference conflicts found"]
}}

Use only these literals for risk_level: "safe", "caution", "red_flag". Use only "accept" or "reject" for recommendation.

Always extract these sections (if present): Payment Terms, IP Rights, Termination Clause, Revision Policy, Non-Compete, Liability, Confidentiality. Skip sections not found in contract.

CONTRACT:
{contract_text}
"""

    try:
        response = model.generate_content(system_and_prompt)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail="The AI service could not analyze this contract. Please try again.",
        ) from e

    try:
        raw = (response.text or "").strip()
    except (ValueError, AttributeError):
        raw = ""
    if not raw:
        raise HTTPException(status_code=502, detail="Empty response from AI service")

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
