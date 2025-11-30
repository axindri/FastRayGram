from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    bot_token: str
    web_app_url: AnyHttpUrl

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", env_prefix="", case_sensitive=False)


settings = Settings()  # type: ignore[call-arg]
