from datetime import datetime, timezone

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.core.logger import setup_logging


class BaseSettingsConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_prefix='', extra='ignore')


class DBSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix='DB_')

    echo: bool = Field(default=False)

    engine: str = Field(default='postgresql+asyncpg')
    host: str = Field(default='localhost')
    port: int = Field(default=5432)
    dbname: str = Field(default='postgres', alias='DB_NAME')

    user: str = Field(default='postgres')
    password: str = Field(default='postgres')

    @property
    def url(self) -> str:
        return f'{self.engine}://{self.user}:{self.password}@{self.host}:{self.port}/{self.dbname}'


class RedisSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix='REDIS_')

    host: str = Field(default='localhost')
    port: int = Field(default=6379)
    db_number: int = Field(default=0)
    max_connections: int = Field(default=100)

    user: str = Field(default='admin')
    user_password: str = Field(default='admin')


class RateLimitSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix='RATE_LIMIT_')

    enabled: bool = Field(default=True)

    exclude_ip_addresses_str: str = Field(default='192.168.65.2,192.168.1.1', alias='EXCLUDE_IP_ADDRESSES')
    default_requests_per_minute: int = Field(default=60)

    host: str = Field(default='localhost')
    port: int = Field(default=6379)
    db_number: int = Field(default=0)
    max_connections: int = Field(default=100)

    user: str = Field(default='admin')
    user_password: str = Field(default='admin')

    @property
    def exclude_ip_addresses(self) -> list[str]:
        return self.exclude_ip_addresses_str.split(',')


class AuthSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix='AUTH_')

    enabled: bool = Field(default=True)

    jwt_master_key: str = Field(default='secret_jwt_master_key')
    jwt_algorithm: str = Field(default='HS256')
    max_sessions: int = Field(default=3)
    access_token_expire_sec: int = Field(default=600)
    refresh_token_expire_sec: int = Field(default=3600 * 24 * 30)

    @property
    def access_token_redis_ttl_sec(self) -> int:
        return self.access_token_expire_sec

    @property
    def refresh_token_redis_ttl_sec(self) -> int:
        return self.refresh_token_expire_sec


class XuiSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix='XUI_')

    scheme: str = Field(default='http')
    host: str = Field(default='localhost')
    port: int | None = Field(default=None)
    subscription_port: int = Field(default=2096)
    secret_path: str = Field(default='/secret_path')
    username: str = Field(default='admin')
    password: str = Field(default='admin')

    @property
    def url(self) -> str:
        if self.port:
            return f'{self.scheme}://{self.host}:{self.port}{self.secret_path}'
        return f'{self.scheme}://{self.host}{self.secret_path}'

    @property
    def subscription_url(self) -> str:
        return f'{self.scheme}://{self.host}:{self.subscription_port}/sub'


class AppSettings(BaseSettingsConfig):
    model_config = SettingsConfigDict(env_prefix='APP_')

    # Basic
    start_time: datetime = Field(default=datetime.now().replace(tzinfo=timezone.utc))
    title: str = Field(default='Fast Ray Gram')
    version: str = Field(default='0.1')
    description: str = Field(default='Fast Ray Gram API')
    secret_path: str = Field(default='/secret_url')
    allowed_domains: str = Field(default='localhost,127.0.0.1,localhost:5173,localhost:3000')

    # Development
    debug: bool = Field(default=False)
    salt: str = Field(default='secret_salt')

    # Startup parameters
    disable_registration_startup_param: bool = Field(default=False)
    max_limit_ip_startup_param: int = Field(default=10)
    max_total_gb_startup_param: int = Field(default=1000)

    # Secrets
    superuser_login: str = Field(default='superuser_login')
    superuser_password: str = Field(default='superuser_password')
    telegram_bot_token: str = Field(default='secret_bot_token')

    # Limits
    base_limit_ip: int = Field(default=1)
    base_total_gb: int = Field(default=100)

    # Dates
    promo_days: int = Field(default=7)
    expiry_days: int = Field(default=30)

    @property
    def docs_path(self) -> str:
        return self.secret_path + '/docs'

    @property
    def openapi_path(self) -> str:
        return self.secret_path + '/openapi.json'


class Settings(BaseSettingsConfig):
    app: AppSettings = Field(default_factory=AppSettings)
    db: DBSettings = Field(default_factory=DBSettings)
    auth: AuthSettings = Field(default_factory=AuthSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    rate_limit: RateLimitSettings = Field(default_factory=RateLimitSettings)
    xui: XuiSettings = Field(default_factory=XuiSettings)


settings = Settings()
setup_logging(settings.app.debug)
