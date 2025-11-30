from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Notification(BaseModel):
    id: str
    social_name: str
    social_login: str
    lang_code: str
    title: dict[str, str]
    content: dict[str, str]
    request_name: str
    request_status: str
    related_name: str
    sent_in_social: str | None
    sent_at: datetime | None
    inserted_dttm: datetime = Field(alias="_inserted_dttm")

    model_config = ConfigDict(from_attributes=True)
