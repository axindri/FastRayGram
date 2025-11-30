from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.standarts import get_datetime_str


class SessionBase(BaseModel):
    user_agent: str | None = None
    ip_address: str | None = None
    device_info: str | None = None
    session_name: str | None = None


class SessionCreate(SessionBase):
    user_id: UUID
    session_token: str
    expires_at: datetime = Field(datetime.now(), examples=[get_datetime_str(datetime.now())])
    last_activity: datetime = Field(datetime.now(), examples=[get_datetime_str(datetime.now())])


class SessionUpdate(BaseModel):
    session_token: str | None = None
    user_agent: str | None = None
    device_info: str | None = None
    ip_address: str | None = None
    expires_at: datetime | None = None
    last_activity: datetime | None = None
    session_name: str | None = None
    is_active: bool | None = None


class SessionResponse(SessionBase):
    id: UUID
    user_agent: str | None = None
    ip_address: str | None = None
    device_info: str | None = None
    session_name: str | None = None
    is_active: bool
    expires_at: datetime
    last_activity: datetime
    is_current: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class SessionFilter(BaseModel):
    id: UUID | None = None
    user_id: UUID | None = None
    is_active: bool | None = None


class SessionDataInToken(BaseModel):
    session_id: str
