"""Map SQLAlchemy failures to HTTP errors with actionable messages."""

from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError


def _database_connection_detail(exc: OperationalError) -> str:
    orig = str(getattr(exc, "orig", exc))
    combined = f"{orig} {exc}".lower()
    if "network is unreachable" in combined or "does not support ipv6" in combined:
        return (
            "Cannot reach Supabase Postgres: this network cannot connect to the direct db.*.supabase.co host "
            "(IPv6-only). In Supabase Dashboard → Connect, copy the Session or Transaction pooler URI into "
            "DATABASE_URL in backend/.env (host like aws-0-<region>.pooler.supabase.com). "
            "Remove square brackets around the password if you copied them from the [YOUR-PASSWORD] placeholder."
        )
    if "password authentication failed" in combined:
        return (
            "Database password rejected. Reset the password in Supabase → Project Settings → Database, "
            "then update DATABASE_URL (URL-encode # as %23; do not wrap the password in [brackets])."
        )
    return (
        "Cannot connect to the database. Check DATABASE_URL in backend/.env and network access to Postgres. "
        "Run: bash scripts/verify-database.sh"
    )


def _schema_migration_detail(exc: ProgrammingError) -> str:
    orig = str(getattr(exc, "orig", exc)).lower()
    if "does not exist" in orig:
        return (
            "Database schema is out of date. In Supabase Dashboard → SQL Editor, run "
            "supabase/migrations/20260524_scam_and_preferences.sql "
            "(adds preference and scam-analysis columns). New projects can use supabase/schema.sql instead."
        )
    return (
        'Database schema may be missing. Run supabase/schema.sql in the Supabase SQL editor '
        '(tables "contracts", "analyses", "preferences"), or the migration file above on existing projects.'
    )


def http_exception_from_sqlalchemy(exc: Exception, *, context: str) -> HTTPException:
    if isinstance(exc, OperationalError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_database_connection_detail(exc),
        )
    if isinstance(exc, ProgrammingError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_schema_migration_detail(exc),
        )
    if isinstance(exc, SQLAlchemyError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error while {context}.",
        )
    raise exc


def raise_http_from_sqlalchemy(exc: Exception, *, context: str) -> None:
    """Re-raise as HTTPException; call from `except` blocks only."""
    raise http_exception_from_sqlalchemy(exc, context=context) from exc
