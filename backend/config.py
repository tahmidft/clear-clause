from functools import lru_cache

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""
    cors_origins: str = "*"
    app_env: str = "development"
    rate_limit_uploads_per_minute: int = 20
    rate_limit_analysis_per_minute: int = 30
    contract_text_retention_days: int = 30
    contract_text_persistence_enabled: bool = True

    @field_validator(
        "supabase_url", "supabase_anon_key", "supabase_service_role_key",
        "database_url", "gemini_api_key", "cors_origins",
        mode="before",
    )
    @classmethod
    def strip_whitespace(cls, v: object) -> object:
        """Strip leading/trailing whitespace and newlines pasted from dashboards."""
        return v.strip() if isinstance(v, str) else v


@lru_cache
def get_settings() -> Settings:
    return Settings()
