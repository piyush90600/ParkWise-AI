from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # MongoDB
    mongodb_url: str = Field(
        default="mongodb://127.0.0.1:27017",
        validation_alias="MONGO_URL"
    )

    mongodb_db: str = Field(
        default="parkwise_ai",
        validation_alias="MONGODB_DB"
    )

    # JWT
    jwt_secret: str = Field(
        default="change-this-in-production",
        validation_alias="JWT_SECRET"
    )

    jwt_algorithm: str = Field(
        default="HS256",
        validation_alias="JWT_ALGORITHM"
    )

    access_token_minutes: int = Field(
        default=1440,
        validation_alias="ACCESS_TOKEN_MINUTES"
    )

    cors_origins: str = Field(
        default="http://127.0.0.1:5500,http://localhost:5500",
        validation_alias="CORS_ORIGINS"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()