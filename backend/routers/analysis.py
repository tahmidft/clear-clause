import logging
from datetime import datetime, timezone
from typing import Literal, cast
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError
from sqlalchemy.orm import Session

from db_errors import raise_http_from_sqlalchemy

from config import get_settings
from db.database import AnalysisRow, ContractRow, PreferenceRow, get_db
from deps import get_current_user_id
from models.schemas import AnalysisResponse, SectionSchema
from security import FixedWindowRateLimiter
from services import gemini
from services.gemini import DEFAULT_PREFERENCES

router = APIRouter()
limiter = FixedWindowRateLimiter()
logger = logging.getLogger(__name__)


def _contract_for_user(db: Session, contract_id: UUID, user_id: str) -> ContractRow | None:
    uid = UUID(user_id)
    return (
        db.query(ContractRow)
        .filter(ContractRow.id == contract_id, ContractRow.user_id == uid)
        .first()
    )


def _preference_dict(db: Session, user_id: str) -> dict:
    uid = UUID(user_id)
    pref = db.query(PreferenceRow).filter(PreferenceRow.user_id == uid).first()
    if not pref:
        return dict(DEFAULT_PREFERENCES)
    out = dict(DEFAULT_PREFERENCES)
    out.update(
        {
            "unpaid_revisions": pref.unpaid_revisions,
            "payment_terms_days": pref.payment_terms_days,
            "ip_ownership": pref.ip_ownership,
            "non_compete": pref.non_compete,
            "termination_notice_days": pref.termination_notice_days,
            "max_revision_rounds": pref.max_revision_rounds,
            "requires_deposit": pref.requires_deposit,
            "min_deposit_percent": pref.min_deposit_percent,
            "liability_cap_required": pref.liability_cap_required,
            "accepts_broad_indemnification": pref.accepts_broad_indemnification,
            "kill_fee_required": pref.kill_fee_required,
            "written_scope_required": pref.written_scope_required,
        }
    )
    return out


def _scam_signals_list(raw) -> list[str]:
    if isinstance(raw, list):
        return [str(x) for x in raw]
    return []


def _row_to_response(row: AnalysisRow) -> AnalysisResponse:
    sections = [SectionSchema.model_validate(s) for s in (row.sections or [])]
    conflicts = row.preference_conflicts or []
    if isinstance(conflicts, list):
        pc = [str(x) for x in conflicts]
    else:
        pc = []
    rec: str = row.recommendation or "reject"
    if rec not in ("accept", "reject"):
        rec = "reject"
    rec_lit = cast(Literal["accept", "reject"], rec)
    scam_risk = (row.scam_risk or "low").lower()
    if scam_risk not in ("low", "medium", "high"):
        scam_risk = "low"
    scam_lit = cast(Literal["low", "medium", "high"], scam_risk)
    return AnalysisResponse(
        id=row.id,
        contract_id=row.contract_id,
        sections=sections,
        overall_score=row.overall_score or 0,
        recommendation=rec_lit,
        recommendation_reason=row.recommendation_reason or "",
        preference_conflicts=pc,
        likely_scam=bool(row.likely_scam),
        scam_risk=scam_lit,
        scam_signals=_scam_signals_list(row.scam_signals),
        created_at=row.created_at,
    )


def _apply_result_to_row(row: AnalysisRow, result: dict) -> None:
    row.sections = result["sections"]
    row.overall_score = result["overall_score"]
    row.recommendation = result["recommendation"]
    row.recommendation_reason = result["recommendation_reason"]
    row.preference_conflicts = result["preference_conflicts"]
    row.likely_scam = result.get("likely_scam", False)
    row.scam_risk = result.get("scam_risk", "low")
    row.scam_signals = result.get("scam_signals", [])


@router.post("/{contract_id}", response_model=AnalysisResponse)
def run_analysis(
    contract_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> AnalysisResponse:
    settings = get_settings()
    limiter.check(f"analysis:{user_id}", settings.rate_limit_analysis_per_minute)
    contract = _contract_for_user(db, contract_id, user_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    if not contract.raw_text or not contract.raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in this contract.",
        )

    try:
        prefs = _preference_dict(db, user_id)
    except (OperationalError, ProgrammingError, SQLAlchemyError) as exc:
        raise_http_from_sqlalchemy(exc, context="loading preferences for analysis")
    result = gemini.analyze_contract(contract.raw_text, prefs)

    now = datetime.now(timezone.utc)
    try:
        existing = db.query(AnalysisRow).filter(AnalysisRow.contract_id == contract_id).first()
        if existing:
            _apply_result_to_row(existing, result)
            existing.created_at = now
            row = existing
        else:
            row = AnalysisRow(
                id=uuid4(),
                contract_id=contract_id,
                sections=result["sections"],
                overall_score=result["overall_score"],
                recommendation=result["recommendation"],
                recommendation_reason=result["recommendation_reason"],
                preference_conflicts=result["preference_conflicts"],
                likely_scam=result.get("likely_scam", False),
                scam_risk=result.get("scam_risk", "low"),
                scam_signals=result.get("scam_signals", []),
                created_at=now,
            )
            db.add(row)

        db.commit()
        db.refresh(row)
    except (OperationalError, ProgrammingError, SQLAlchemyError) as exc:
        db.rollback()
        logger.exception("Failed to save analysis for contract %s", contract_id)
        raise_http_from_sqlalchemy(exc, context="saving analysis")
    return _row_to_response(row)


@router.get("/{contract_id}", response_model=AnalysisResponse)
def get_analysis(
    contract_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> AnalysisResponse:
    contract = _contract_for_user(db, contract_id, user_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    try:
        row = db.query(AnalysisRow).filter(AnalysisRow.contract_id == contract_id).first()
    except (OperationalError, ProgrammingError, SQLAlchemyError) as exc:
        raise_http_from_sqlalchemy(exc, context="loading analysis")
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found for this contract.")
    return _row_to_response(row)
