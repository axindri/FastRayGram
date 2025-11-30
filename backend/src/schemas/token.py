from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.standarts import get_datetime_str


class RefreshResponse(BaseModel):
    id: UUID
    token: str
    user_id: UUID
    session_id: UUID
    expires_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class RefreshCreate(BaseModel):
    token: str
    user_id: UUID
    session_id: UUID
    expires_at: datetime = Field(datetime.now(), examples=[get_datetime_str(datetime.now())])
    is_active: bool


class RefreshUpdate(BaseModel):
    token: str | None = None
    user_id: UUID | None = None
    session_id: UUID | None = None
    expires_at: datetime | None = Field(None, examples=[get_datetime_str(datetime.now())])
    is_active: bool | None = None


class RefreshFilter(BaseModel):
    pass
