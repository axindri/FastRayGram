from datetime import datetime, timedelta
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.enums import ConfigStatuses, ConfigTypes
from src.core.standarts import get_datetime_str
from src.schemas.mixins import UUIDMixin


class ConfigCreate(BaseModel):
    type: ConfigTypes
    status: ConfigStatuses = ConfigStatuses.NOT_UPDATED
    user_id: UUID
    client_id: str | None = None
    client_email: str
    used_gb: float = 0
    total_gb: int
    limit_ip: int
    subscription_url: str | None = None
    connection_url: str | None = None
    valid_from_dttm: datetime = Field(datetime.now(), examples=[get_datetime_str(datetime.now())])
    valid_to_dttm: datetime = Field(datetime.now(), examples=[get_datetime_str(datetime.now() + timedelta(days=30))])


class ConfigUpdate(BaseModel):
    type: str | None = Field(default=None, min_length=1, max_length=100)
    status: ConfigStatuses | None = None
    client_id: str | None = None
    client_email: str | None = None
    used_gb: float | None = None
    total_gb: int | None = None
    limit_ip: int | None = None
    subscription_url: str | None = None
    connection_url: str | None = None
    valid_from_dttm: datetime | None = None
    valid_to_dttm: datetime | None = None


class ConfigRequestLimitsUpdate(BaseModel):
    total_gb: int | None = Field(None, ge=0)
    limit_ip: int | None = Field(None, ge=0)


class ConfigLimitsUpdate(BaseModel):
    total_gb: int | None = None
    limit_ip: int | None = None
    valid_to_dttm: datetime | None = Field(None, examples=[get_datetime_str(datetime.now() + timedelta(days=30))])


class ConfigSimpleResponse(UUIDMixin, BaseModel):
    type: str
    status: ConfigStatuses | None = None
    user_id: UUID


class ConfigResponse(UUIDMixin, BaseModel):
    type: str
    status: ConfigStatuses | None = None
    user_id: UUID
    client_id: str | None = None
    client_email: str
    used_gb: float
    total_gb: int
    limit_ip: int
    subscription_url: str | None = None
    connection_url: str | None = None
    valid_from_dttm: datetime | None = None
    valid_to_dttm: datetime | None = None
    updated_dttm: datetime = Field(alias='_updated_dttm')

    model_config = ConfigDict(from_attributes=True)


class ConfigFilter(BaseModel):
    type: ConfigTypes | None = None
    status: ConfigStatuses | None = None
    user_id: UUID | None = None
    client_id: str | None = None
