import os
import re
from datetime import datetime
from functools import lru_cache
from typing import Generator

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

from config import get_settings


def _normalize_database_url(url: str) -> str:
    """Normalize Supabase Postgres URIs from dashboard copy/paste."""
    if not url:
        return url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    # Dashboard placeholders use [YOUR-PASSWORD]; copying them literally breaks libpq/urlparse.
    url = re.sub(
        r"(postgresql://[^:]+):\[([^\]]+)\]@",
        r"\1:\2@",
        url,
        count=1,
    )
    if "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


def _database_url() -> str:
    settings = get_settings()
    return _normalize_database_url(
        os.environ.get("DATABASE_URL", settings.database_url or "")
    )


@lru_cache
def get_engine() -> Engine:
    url = _database_url()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not configured. Set it in Render env or backend/.env."
        )
    return create_engine(url, pool_pre_ping=True)


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())


class Base(DeclarativeBase):
    pass


class PreferenceRow(Base):
    __tablename__ = "preferences"

    id = Column(PGUUID(as_uuid=True), primary_key=True)
    # FK to auth.users exists in supabase/schema.sql; omit ORM FK (auth schema is not in metadata).
    user_id = Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True)
    unpaid_revisions = Column(Boolean, default=False)
    payment_terms_days = Column(Integer, default=30)
    ip_ownership = Column(Boolean, default=True)
    non_compete = Column(Boolean, default=False)
    termination_notice_days = Column(Integer, default=14)
    max_revision_rounds = Column(Integer, default=3)
    requires_deposit = Column(Boolean, default=True)
    min_deposit_percent = Column(Integer, default=25)
    liability_cap_required = Column(Boolean, default=True)
    accepts_broad_indemnification = Column(Boolean, default=False)
    kill_fee_required = Column(Boolean, default=True)
    written_scope_required = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ContractRow(Base):
    __tablename__ = "contracts"

    id = Column(PGUUID(as_uuid=True), primary_key=True)
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    file_name = Column(Text, nullable=False)
    storage_path = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    analysis = relationship("AnalysisRow", back_populates="contract", uselist=False, cascade="all, delete-orphan")


class AnalysisRow(Base):
    __tablename__ = "analyses"

    id = Column(PGUUID(as_uuid=True), primary_key=True)
    contract_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    sections = Column(JSONB, nullable=False)
    overall_score = Column(Integer, nullable=True)
    recommendation = Column(String(16), nullable=True)
    recommendation_reason = Column(Text, nullable=True)
    preference_conflicts = Column(JSONB, nullable=True)
    likely_scam = Column(Boolean, default=False)
    scam_risk = Column(String(16), default="low")
    scam_signals = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    contract = relationship("ContractRow", back_populates="analysis")


def get_db() -> Generator[Session, None, None]:
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
