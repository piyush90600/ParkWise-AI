from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# Backend folder
BASE_DIR = Path(__file__).resolve().parents[2]

# .env location:
# Backend/app/.env
ENV_FILE = BASE_DIR / "app" / ".env"


class Settings(BaseSettings):

    # MongoDB
    mongodb_url: str = Field(
        # default="mongodb://127.0.0.1:27017",
        validation_alias="MONGO_URL"
    )

    mongodb_db: str = Field(
        # default="parkwise_ai",
        validation_alias="MONGODB_DB"
    )

    # JWT
    jwt_secret: str = Field(
        # default="parkwise-ai-secret-key-change-in-production",
        validation_alias="JWT_SECRET"
    )

    jwt_algorithm: str = Field(
        # default="HS256",
        validation_alias="JWT_ALGORITHM"
    )

    access_token_minutes: int = Field(
        # default=1440,
        validation_alias="ACCESS_TOKEN_MINUTES"
    )

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()