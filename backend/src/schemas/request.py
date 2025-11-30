from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.enums import RequestNames


class RequestCreate(BaseModel):
    user_id: UUID
    name: RequestNames
    related_id: UUID
    related_name: str
    data: dict[str, Any]


class RequestUpdate(BaseModel):
    data: dict[str, Any] | None = None


class RequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    related_id: UUID
    related_name: str
    data: dict[str, Any]
    inserted_dttm: datetime = Field(alias='_inserted_dttm')

    model_config = ConfigDict(from_attributes=True)


class RequestFilter(BaseModel):
    user_id: UUID | None = None
    name: RequestNames | None = None
    related_id: UUID | None = None
    related_name: str | None = None
