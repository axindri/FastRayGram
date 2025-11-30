from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseSettingsConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")


class TelegramSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix="TELEGRAM_")

    bot_token: str = Field(default="")
    web_app_url: str = Field(default="")
    superuser_id: int = Field(default=0)


class DBSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix="DB_")

    host: str = Field(default="localhost")
    port: int = Field(default=5432)
    dbname: str = Field(default="postgres", alias="DB_NAME")
    user: str = Field(default="postgres")
    password: str = Field(default="postgres")


class AppSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix="APP_")

    debug: bool = Field(default=False)
    cleanup_period_days: int = Field(default=2)
    process_period_sec: int = Field(default=10)
    config_expiry_notif_hours: int = Field(default=2)


class Settings(BaseSettingsConfig):
    app: AppSettings = Field(default_factory=AppSettings)
    db: DBSettings = Field(default_factory=DBSettings)
    telegram: TelegramSettings = Field(default_factory=TelegramSettings)


settings = Settings()
