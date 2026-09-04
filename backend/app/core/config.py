from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://127.0.0.1:27017"
    mongodb_db: str = "parkwise_ai"
    jwt_secret: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 1440
    frontend_origins: str = "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:8000,http://localhost:8000"
    model_path: str = "../../ML/occupancy_model.joblib"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    @property
    def cors_origins(self): return [x.strip() for x in self.frontend_origins.split(",") if x.strip()]
settings = Settings()
