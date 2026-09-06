from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):

    mongodb_url: str
    mongodb_db: str = "parkwise_ai"

    jwt_secret: str
    jwt_algorithm: str = "HS256"

    access_token_minutes: int = 1440

    frontend_origins: str = ""

    model_path: str = str(
        BASE_DIR / "ML" / "occupancy_model.joblib"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    @property
    def cors_origins(self):
        return [
            x.strip()
            for x in self.frontend_origins.split(",")
            if x.strip()
        ]


settings = Settings()