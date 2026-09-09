from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):

    # ========================================================
    # MongoDB
    # ========================================================

    mongodb_url: str = Field(
        ...,
        validation_alias="MONGO_URL"
    )

    mongodb_db: str = Field(
        default="parkwise_ai",
        validation_alias="MONGODB_DB"
    )


    # ========================================================
    # ML MODEL
    # ========================================================

    model_path: str = str(
        BASE_DIR.parent / "ML" / "occupancy_model.joblib"
    )


    # ========================================================
    # SETTINGS
    # ========================================================

    model_config = SettingsConfigDict(

        env_file=str(BASE_DIR / ".env"),

        env_file_encoding="utf-8",

        extra="ignore"

    )


settings = Settings()