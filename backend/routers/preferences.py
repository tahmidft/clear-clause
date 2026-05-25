from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import PreferenceRow, get_db
from db_errors import raise_http_from_sqlalchemy
from deps import get_current_user_id
from models.schemas import PreferenceCreate, PreferenceResponse

router = APIRouter()


@router.post("", response_model=PreferenceResponse)
def upsert_preferences(
    body: PreferenceCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PreferenceResponse:
    uid = UUID(user_id)
    now = datetime.now(timezone.utc)
    try:
        row = db.query(PreferenceRow).filter(PreferenceRow.user_id == uid).first()
        if row:
            row.unpaid_revisions = body.unpaid_revisions
            row.payment_terms_days = body.payment_terms_days
            row.ip_ownership = body.ip_ownership
            row.non_compete = body.non_compete
            row.termination_notice_days = body.termination_notice_days
            row.max_revision_rounds = body.max_revision_rounds
            row.requires_deposit = body.requires_deposit
            row.min_deposit_percent = body.min_deposit_percent
            row.liability_cap_required = body.liability_cap_required
            row.accepts_broad_indemnification = body.accepts_broad_indemnification
            row.kill_fee_required = body.kill_fee_required
            row.written_scope_required = body.written_scope_required
            row.updated_at = now
        else:
            row = PreferenceRow(
                id=uuid4(),
                user_id=uid,
                unpaid_revisions=body.unpaid_revisions,
                payment_terms_days=body.payment_terms_days,
                ip_ownership=body.ip_ownership,
                non_compete=body.non_compete,
                termination_notice_days=body.termination_notice_days,
                max_revision_rounds=body.max_revision_rounds,
                requires_deposit=body.requires_deposit,
                min_deposit_percent=body.min_deposit_percent,
                liability_cap_required=body.liability_cap_required,
                accepts_broad_indemnification=body.accepts_broad_indemnification,
                kill_fee_required=body.kill_fee_required,
                written_scope_required=body.written_scope_required,
                created_at=now,
                updated_at=now,
            )
            db.add(row)
        db.commit()
        db.refresh(row)
    except (OperationalError, ProgrammingError, SQLAlchemyError) as exc:
        raise_http_from_sqlalchemy(exc, context="saving preferences")
    return PreferenceResponse.model_validate(row)


@router.get("", response_model=PreferenceResponse)
def get_preferences(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PreferenceResponse:
    uid = UUID(user_id)
    try:
        row = db.query(PreferenceRow).filter(PreferenceRow.user_id == uid).first()
    except (OperationalError, ProgrammingError, SQLAlchemyError) as exc:
        raise_http_from_sqlalchemy(exc, context="loading preferences")
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No saved preferences yet.",
        )
    return PreferenceResponse.model_validate(row)
