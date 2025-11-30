from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BaseMixin(BaseModel):
    id: UUID
    _inserted_dttm: datetime
    _updated_dttm: datetime

    model_config = ConfigDict(from_attributes=True)


class UUIDMixin(BaseModel):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
