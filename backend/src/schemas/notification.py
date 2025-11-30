from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.enums import LangCodes, RequestNames, RequestStatuses
from src.schemas.mixins import UUIDMixin


class NotificationCreate(BaseModel):
    title: dict[LangCodes, str] = Field(default={})
    content: dict[LangCodes, str] = Field(default={})
    user_id: UUID
    request_name: RequestNames | None = None
    request_status: RequestStatuses | None = None
    related_name: str | None = None
    related_id: UUID | None = None


class NotificationUpdate(BaseModel):
    title: dict[LangCodes, str] | None = Field(default=None)
    content: dict[LangCodes, str] | None = Field(default=None)
    sent_at: datetime | None = None
    sent_in_social: str = Field(min_length=1, max_length=128)


class NotificationResponse(UUIDMixin, BaseModel):
    title: dict[str, Any]
    content: dict[str, Any]
    user_id: UUID
    request_name: RequestNames | None = None
    request_status: RequestStatuses | None = None
    related_name: str | None = None
    related_id: UUID | None = None
    sent_in_social: str | None = None
    sent_at: datetime | None = None
    inserted_dttm: datetime = Field(alias='_inserted_dttm')

    model_config = ConfigDict(from_attributes=True)


class NotificationFilter(BaseModel):
    id: UUID | None = None
    user_id: UUID | None = None
    request_name: RequestNames | None = None
    request_status: RequestStatuses | None = None
    related_name: str | None = None
    related_id: UUID | None = None
    sent_in_social: str | None = None
    sent_at: datetime | None = None
