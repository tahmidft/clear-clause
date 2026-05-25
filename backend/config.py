from functools import lru_cache

from dotenv import load_dotenv
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
