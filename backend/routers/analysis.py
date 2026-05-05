from datetime import datetime, timezone
from typing import Literal, cast
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import AnalysisRow, ContractRow, PreferenceRow, get_db
from deps import get_current_user_id
from models.schemas import AnalysisResponse, SectionSchema
from services import gemini

router = APIRouter()


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
        return {
            "unpaid_revisions": False,
            "payment_terms_days": 30,
            "ip_ownership": True,
            "non_compete": False,
            "termination_notice_days": 14,
        }
    return {
        "unpaid_revisions": pref.unpaid_revisions,
        "payment_terms_days": pref.payment_terms_days,
        "ip_ownership": pref.ip_ownership,
        "non_compete": pref.non_compete,
        "termination_notice_days": pref.termination_notice_days,
    }


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
    return AnalysisResponse(
        id=row.id,
        contract_id=row.contract_id,
        sections=sections,
        overall_score=row.overall_score or 0,
        recommendation=rec_lit,
        recommendation_reason=row.recommendation_reason or "",
        preference_conflicts=pc,
        created_at=row.created_at,
    )


@router.post("/{contract_id}", response_model=AnalysisResponse)
def run_analysis(
    contract_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> AnalysisResponse:
    contract = _contract_for_user(db, contract_id, user_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    if not contract.raw_text or not contract.raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in this contract.",
        )

    prefs = _preference_dict(db, user_id)
    result = gemini.analyze_contract(contract.raw_text, prefs)

    now = datetime.now(timezone.utc)
    existing = db.query(AnalysisRow).filter(AnalysisRow.contract_id == contract_id).first()
    if existing:
        existing.sections = result["sections"]
        existing.overall_score = result["overall_score"]
        existing.recommendation = result["recommendation"]
        existing.recommendation_reason = result["recommendation_reason"]
        existing.preference_conflicts = result["preference_conflicts"]
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
            created_at=now,
        )
        db.add(row)

    db.commit()
    db.refresh(row)
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

    row = db.query(AnalysisRow).filter(AnalysisRow.contract_id == contract_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found for this contract.")
    return _row_to_response(row)
