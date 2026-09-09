from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[1]

ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):

    mongodb_url: str
    mongodb_db: str = "parkwise_ai"
    jwt_secret: str


    model_config = SettingsConfigDict(

        env_file=str(ENV_FILE),

        env_file_encoding="utf-8",

        extra="ignore"

    )


settings = Settings()