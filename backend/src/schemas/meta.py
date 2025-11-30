from pydantic import BaseModel


class RequestMeta(BaseModel):
    user_agent: str | None = None
    ip_address: str | None = None
    device_info: str | None = None
    session_name: str | None = None
