from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.enums import LangCodes
from src.schemas.mixins import UUIDMixin


class NewsCreate(BaseModel):
    title: dict[LangCodes, str] = Field(default={})
    content: dict[LangCodes, str] = Field(default={})


class NewsUpdate(BaseModel):
    title: dict[LangCodes, str] | None = Field(default=None)
    content: dict[LangCodes, str] | None = Field(default=None)


class NewsResponse(UUIDMixin, BaseModel):
    title: dict[str, Any]
    content: dict[str, Any]
    inserted_dttm: datetime = Field(alias='_inserted_dttm')

    model_config = ConfigDict(from_attributes=True)


class NewsFilter(BaseModel):
    id: UUID | None = None
