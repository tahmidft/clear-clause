import mimetypes
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import ContractRow, get_db
from db_errors import raise_http_from_sqlalchemy
from config import get_settings
from deps import get_current_user_id
from models.schemas import ContractSummary, ContractUploadResponse
from security import FixedWindowRateLimiter
from services import parser
from services import storage as storage_service

router = APIRouter()

MAX_BYTES = 10 * 1024 * 1024
ALLOWED = {
    "application/pdf",
    "application/x-pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
limiter = FixedWindowRateLimiter()


def _content_type(filename: str, upload: UploadFile) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    ct = (upload.content_type or guessed or "").split(";")[0].strip().lower()
    if ct in ALLOWED:
        return ct
    if filename.lower().endswith(".pdf"):
        return "application/pdf"
    if filename.lower().endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only PDF and DOCX files are supported.",
    )


def _validate_magic_bytes(content_type: str, raw: bytes) -> None:
    if content_type == "application/pdf" and not raw.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Invalid PDF file signature.")
    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        if not raw.startswith(b"PK"):
            raise HTTPException(status_code=400, detail="Invalid DOCX file signature.")


def _apply_text_retention(db: Session, user_id: UUID, days: int) -> None:
    if days <= 0:
        return
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    (
        db.query(ContractRow)
        .filter(
            ContractRow.user_id == user_id,
            ContractRow.created_at < cutoff,
            ContractRow.raw_text.isnot(None),
        )
        .update({"raw_text": None}, synchronize_session=False)
    )
    db.commit()


@router.post("/upload", response_model=ContractUploadResponse)
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ContractUploadResponse:
    settings = get_settings()
    limiter.check(f"upload:{user_id}", settings.rate_limit_uploads_per_minute)
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")

    content_type = _content_type(file.filename, file)
    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Maximum size is 10 MB.",
        )
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="The file appears to be empty.")
    _validate_magic_bytes(content_type, raw)

    try:
        text = parser.extract_text(raw, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    uid = UUID(user_id)
    _apply_text_retention(db, uid, settings.contract_text_retention_days)
    try:
        storage_path, file_url = storage_service.upload_contract_bytes(user_id, raw, file.filename, content_type)
    except Exception as e:
        msg = str(e).strip()
        if "Bucket not found" in msg or "bucket" in msg.lower():
            detail = (
                f'Could not store the file. Create a public Storage bucket named "{storage_service.BUCKET}" '
                "in Supabase → Storage (see README / supabase skill)."
            )
        elif msg:
            detail = f"Could not store the file: {msg}"
        else:
            detail = "Could not store the file. Check Supabase Storage and SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        raise HTTPException(status_code=502, detail=detail) from e

    now = datetime.now(timezone.utc)
    store_raw_text = settings.contract_text_persistence_enabled
    row = ContractRow(
        id=uuid4(),
        user_id=uid,
        file_name=file.filename,
        storage_path=storage_path,
        file_url=file_url,
        raw_text=text if store_raw_text else None,
        created_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return ContractUploadResponse(
        id=row.id,
        user_id=row.user_id,
        file_name=row.file_name,
        storage_path=row.storage_path,
        file_url=row.file_url,
        created_at=row.created_at,
    )


@router.get("", response_model=list[ContractSummary])
def list_contracts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[ContractSummary]:
    settings = get_settings()
    uid = UUID(user_id)
    try:
        _apply_text_retention(db, uid, settings.contract_text_retention_days)
        rows = (
            db.query(ContractRow)
            .filter(ContractRow.user_id == uid)
            .order_by(ContractRow.created_at.desc())
            .all()
        )
    except (OperationalError, ProgrammingError, SQLAlchemyError) as exc:
        raise_http_from_sqlalchemy(exc, context="loading contracts")
    return [
        ContractSummary(
            id=r.id,
            user_id=r.user_id,
            file_name=r.file_name,
            storage_path=r.storage_path,
            file_url=r.file_url,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> None:
    uid = UUID(user_id)
    row = (
        db.query(ContractRow)
        .filter(ContractRow.id == contract_id, ContractRow.user_id == uid)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Contract not found.")

    try:
        storage_service.delete_contract_object(row.storage_path, row.file_url)
    except Exception:
        pass

    db.delete(row)
    db.commit()
