from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PreferenceBase(BaseModel):
    unpaid_revisions: bool = False
    payment_terms_days: int = Field(default=30, ge=7, le=60)
    ip_ownership: bool = True
    non_compete: bool = False
    termination_notice_days: int = Field(default=14, ge=7, le=60)
    max_revision_rounds: int = Field(default=3, ge=0, le=20)
    requires_deposit: bool = True
    min_deposit_percent: int = Field(default=25, ge=0, le=100)
    liability_cap_required: bool = True
    accepts_broad_indemnification: bool = False
    kill_fee_required: bool = True
    written_scope_required: bool = True


class PreferenceCreate(PreferenceBase):
    pass


class PreferenceResponse(PreferenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ContractResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    file_name: str
    file_url: str | None
    raw_text: str | None = None
    created_at: datetime | None = None


class ContractSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    file_name: str
    storage_path: str | None = None
    file_url: str | None
    created_at: datetime | None = None


class ContractUploadResponse(BaseModel):
    id: UUID
    user_id: UUID
    file_name: str
    storage_path: str | None = None
    file_url: str | None
    created_at: datetime | None = None


class SectionSchema(BaseModel):
    title: str
    plain_english: str
    original_text: str
    risk_level: Literal["safe", "caution", "red_flag"]
    risk_reason: str
    conflicts_with_preference: bool


ScamRisk = Literal["low", "medium", "high"]


class AnalysisResult(BaseModel):
    sections: list[SectionSchema]
    overall_score: int = Field(ge=0, le=100)
    recommendation: Literal["accept", "reject"]
    recommendation_reason: str
    preference_conflicts: list[str]
    likely_scam: bool = False
    scam_risk: ScamRisk = "low"
    scam_signals: list[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    contract_id: UUID
    sections: list[SectionSchema]
    overall_score: int
    recommendation: Literal["accept", "reject"]
    recommendation_reason: str
    preference_conflicts: list[str]
    likely_scam: bool = False
    scam_risk: ScamRisk = "low"
    scam_signals: list[str] = Field(default_factory=list)
    created_at: datetime | None = None


class HealthResponse(BaseModel):
    status: str
