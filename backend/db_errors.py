"""Map SQLAlchemy failures to HTTP errors with actionable messages."""

from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError


def raise_http_from_sqlalchemy(exc: Exception, *, context: str) -> None:
    """Re-raise as HTTPException; call from `except` blocks only."""
    if isinstance(exc, OperationalError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to the database. Check DATABASE_URL in backend/.env and network access to Postgres.",
        ) from exc
    if isinstance(exc, ProgrammingError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Database schema may be missing. Run supabase/schema.sql in the Supabase SQL editor (tables "contracts", "analyses", "preferences").',
        ) from exc
    if isinstance(exc, SQLAlchemyError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error while {context}.",
        ) from exc
    raise exc
