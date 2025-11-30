from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from src.core.enums import AppSettingsNames, AppStatuses
from src.core.settings import settings


class BasicSettings(BaseModel):
    disable_registration: bool = Field(default=False)


class ServiceSettings(BaseModel):
    max_limit_ip: int = Field(default=settings.app.max_limit_ip_startup_param, ge=0)
    max_total_gb: int = Field(default=settings.app.max_total_gb_startup_param, ge=0)


class AppSettingsResponse(BaseModel):
    name: str
    values: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class AppSettingsCreate(BaseModel):
    name: AppSettingsNames
    values: dict[str, Any]


class AppSettingsJsonResponse(BaseModel):
    basic: BasicSettings
    service: ServiceSettings

    model_config = ConfigDict(from_attributes=True)


class AppSettingsJsonUpdate(BaseModel):
    basic: BasicSettings | None = None
    service: ServiceSettings | None = None


class StatusesResponse(BaseModel):
    total: AppStatuses
    api: AppStatuses
    db: AppStatuses
    redis: AppStatuses
    rate_limiter_redis: AppStatuses
    xui: AppStatuses
    allowed_statuses: list[AppStatuses]


class AppStatusResponse(BaseModel):
    statuses: StatusesResponse
    now_timestamp: str
    uptime: str
