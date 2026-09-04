from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://127.0.0.1:27017"
    mongodb_db: str = "parkwise_ai"
    jwt_secret: str = "change-this-in-production"
    jwt_expire_minutes: int = 1440
    cors_origins: str = "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:3000,http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
