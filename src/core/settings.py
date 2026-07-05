from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import BaseModel, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class CacheSettings(BaseModel):
    namespace: str = Field(default="fast-ray-gram")
    default_ttl_seconds: int = Field(default=60)


class AppSettings(BaseModel):
    name: str = Field(default="Fast Ray Gram API")
    version: str = Field(default="1.7.0")
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    debug: bool = Field(default=False)
    request_timeout: int = Field(default=10)
    jwt_secret: str = Field(default="jwt_secret")
    jwt_exp_days: int = Field(default=365)
    superuser_token: str = Field(default="superuser_token")
    min_invoice_amount: int = Field(default=100)
    max_invoice_amount: int = Field(default=1000)
    default_expiry_time_days: int = Field(default=30)
    registration_expiry_time_days: int = Field(default=3)
    default_registration_code_max_uses: int = Field(default=1)
    default_limit_ips: int = Field(default=5)
    monitoring_service_url: str = Field(default="http://localhost:8000/status/")
    boosty_url: str = Field(default="http://localhost")
    github_url: str = Field(default="https://github.com/axindri/FastRayGram")


class DatabaseSettings(BaseModel):
    host: str = Field(default="localhost")
    port: int = Field(default=5432)
    user: str = Field(default="fastraygram")
    password: str = Field(default="change-me")
    db: str = Field(default="fastraygram")

    @computed_field
    @property
    def url(self) -> str:
        user = quote_plus(self.user)
        password = quote_plus(self.password)
        return f"postgresql+asyncpg://{user}:{password}@{self.host}:{self.port}/{self.db}"


class XuiPanelSettings(BaseModel):
    url: str = Field(default="http://localhost:8080/AbCd")
    sub_url: str = Field(default="http://localhost:8080/sub")
    api_key: str = Field(default="xui_api_key")


class TimeWebSettings(BaseModel):
    base_url: str = Field(default="https://api.timeweb.cloud/api/v1")
    portal_url: str = Field(default="https://timeweb.cloud/portal/v4")
    servers_url: str = Field(default="https://timeweb.cloud/my/servers")
    api_url: str = Field(default="https://timeweb.cloud/api/v1")
    token: str = Field(default="")
    payer_id: int = Field(default=0)
    default_headers: dict = Field(
        default={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
            AppleWebKit/537.36 (KHTML, like Gecko) \
            Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
        }
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="ignore",
    )

    app: AppSettings = Field(default_factory=AppSettings, alias="APP")
    cache: CacheSettings = Field(default_factory=CacheSettings, alias="CACHE")
    database: DatabaseSettings = Field(default_factory=DatabaseSettings, alias="DB")
    xui: XuiPanelSettings = Field(default_factory=XuiPanelSettings, alias="XUI")
    timeweb: TimeWebSettings = Field(default_factory=TimeWebSettings, alias="TIMEWEB")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
