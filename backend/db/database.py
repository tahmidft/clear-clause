import os
from datetime import datetime
from typing import Generator

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

from config import get_settings


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


settings = get_settings()
DATABASE_URL = _normalize_database_url(
    os.environ.get("DATABASE_URL", settings.database_url or "")
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class PreferenceRow(Base):
    __tablename__ = "preferences"

    id = Column(PGUUID(as_uuid=True), primary_key=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), unique=True, nullable=False)
    unpaid_revisions = Column(Boolean, default=False)
    payment_terms_days = Column(Integer, default=30)
    ip_ownership = Column(Boolean, default=True)
    non_compete = Column(Boolean, default=False)
    termination_notice_days = Column(Integer, default=14)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ContractRow(Base):
    __tablename__ = "contracts"

    id = Column(PGUUID(as_uuid=True), primary_key=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=False)
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
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    contract = relationship("ContractRow", back_populates="analysis")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
