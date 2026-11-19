import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NusaJalur Backend"
    PROJECT_SLUG: str = "matchabaobei"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    BASE_URL: str = "https://matchabaobei.stei.fun"
    API_V1_PREFIX: str = "/api/v1"

    # JWT Authentication
    JWT_SECRET_KEY: str = "supersecretjwtkey_matchabaobei_tst2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database Configuration (SQLite WAL mode)
    DATABASE_URL: str = "sqlite:///./data/nusajalur.db"

    # B2B Server-to-Server X-API-Key
    DEFAULT_API_KEY: str = "nj_live_matchabaobei_tst2026_secret_key"
    DEFAULT_API_KEY_NAME: str = "Belva Health & Wellbeing Group"

    # Cloudflare Tunnel
    TUNNEL_TOKEN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
