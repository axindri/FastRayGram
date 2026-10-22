from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.models.fields import Username


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    username: str = ""
    title: str
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateNotificationRequest(BaseModel):
    username: Username
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=4000)


class UpdateNotificationRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, min_length=1, max_length=4000)
