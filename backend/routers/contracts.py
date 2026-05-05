import mimetypes
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from db.database import ContractRow, get_db
from deps import get_current_user_id
from models.schemas import ContractSummary, ContractUploadResponse
from services import parser
from services import storage as storage_service

router = APIRouter()

MAX_BYTES = 10 * 1024 * 1024
ALLOWED = {
    "application/pdf",
    "application/x-pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


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


@router.post("/upload", response_model=ContractUploadResponse)
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ContractUploadResponse:
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

    try:
        text = parser.extract_text(raw, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    uid = UUID(user_id)
    try:
        file_url = storage_service.upload_contract_bytes(user_id, raw, file.filename, content_type)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail="Could not store the file. Check that the contracts storage bucket exists.",
        ) from e

    now = datetime.now(timezone.utc)
    row = ContractRow(
        id=uuid4(),
        user_id=uid,
        file_name=file.filename,
        file_url=file_url,
        raw_text=text,
        created_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return ContractUploadResponse(
        id=row.id,
        user_id=row.user_id,
        file_name=row.file_name,
        file_url=row.file_url,
        created_at=row.created_at,
    )


@router.get("", response_model=list[ContractSummary])
def list_contracts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[ContractSummary]:
    uid = UUID(user_id)
    rows = (
        db.query(ContractRow)
        .filter(ContractRow.user_id == uid)
        .order_by(ContractRow.created_at.desc())
        .all()
    )
    return [
        ContractSummary(
            id=r.id,
            user_id=r.user_id,
            file_name=r.file_name,
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
        storage_service.delete_contract_object(row.file_url)
    except Exception:
        pass

    db.delete(row)
    db.commit()
