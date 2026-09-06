from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Project structure:
# ParkWise-AI/
# └── Backend/
#     ├── app/
#     │   ├── core/
#     │   │   └── config.py
#     │   └── .env
#     └── ML/


PROJECT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = PROJECT_DIR / "Backend"

# Correct .env location
ENV_FILE = BACKEND_DIR / "app" / ".env"


class Settings(BaseSettings):

    mongodb_url: str
    mongodb_db: str = "parkwise_ai"

    jwt_secret: str
    jwt_algorithm: str = "HS256"

    access_token_minutes: int = 1440

    frontend_origins: str = (
    "http://127.0.0.1:5500,"
    "http://localhost:5500,"
    "http://127.0.0.1:5501,"
    "http://localhost:5501,"
    "http://127.0.0.1:5173,"
    "http://localhost:5173,"
    "http://127.0.0.1:8080,"
    "http://localhost:8080,"
    "http://127.0.0.1:3000,"
    "http://localhost:3000"
)

    # ML model location
    model_path: str = str(
        BACKEND_DIR / "ML" / "occupancy_model.joblib"
    )

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
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