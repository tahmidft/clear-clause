"""Gemini helper tests (no live API calls)."""

from services import gemini


def test_model_candidates_prefers_lite_first(monkeypatch):
    class FakeSettings:
        gemini_model = "gemini-2.5-flash-lite"

    monkeypatch.setattr(gemini, "get_settings", lambda: FakeSettings())
    names = gemini._model_candidates()
    assert names[0] == "gemini-2.5-flash-lite"


def test_extract_json_object_strips_fence():
    raw = (
        '```json\n{"sections": [], "overall_score": 50, '
        '"recommendation": "reject", "recommendation_reason": "x", '
        '"preference_conflicts": []}\n```'
    )
    out = gemini._extract_json_object(raw)
    assert out.startswith("{")
    assert "sections" in out


def test_normalize_clears_scam_fields_for_engine():
    payload = {
        "sections": [],
        "overall_score": 40,
        "recommendation": "accept",
        "recommendation_reason": "x",
        "preference_conflicts": [],
        "likely_scam": "true",
        "scam_risk": "HIGH",
        "scam_signals": ["crypto upfront fee"],
    }
    gemini._normalize_analysis_payload(payload)
    assert payload["likely_scam"] is False
    assert payload["scam_risk"] == "low"
    assert payload["scam_signals"] == []
