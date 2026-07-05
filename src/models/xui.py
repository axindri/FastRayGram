from datetime import datetime

from pydantic import BaseModel, Field


class CreateClientRequest(BaseModel):
    email: str
    comment: str = Field(default="")
    flow: str = Field(default="")
    total_gb: int = Field(default=0)
    expiry_time_days: int = Field(default=0)
    limit_ips: int = Field(default=0)
    enable: bool = Field(default=True)


class ClientResponse(BaseModel):
    id: int
    email: str
    sub_id: str
    sub_url: str
    uuid: str
    flow: str
    limit_ips: int
    total_gb: float
    enable: bool
    expiry_datetime: datetime
    comment: str
    used_traffic: int
    inbound_ids: list[int]


class UpdateClientRequest(BaseModel):
    expiry_time_days: int | None = None
    enable: bool | None = None
    limit_ips: int | None = None
    comment: str | None = None
