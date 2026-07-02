from pydantic import BaseModel, Field

from src.core.enums import Role
from src.core.settings import settings
from src.models.fields import OptionalMark, Username
from src.models.tw import InvoiceResponse


class CreateUserRequest(BaseModel):
    username: Username
    role: Role = Field(default=Role.USER)
    mark: OptionalMark = ""
    flow: str = Field(default="")
    limit_ips: int = Field(default=settings.app.default_limit_ips)
    total_gb: float = Field(default=0)
    enable: bool = Field(default=True)
    expiry_time_days: int = Field(default=settings.app.default_expiry_time_days)


class UserProfileResponse(BaseModel):
    id: int
    username: str
    role: Role = Field(default=Role.USER)
    sub_url: str = Field(default="")
    invoices: list[InvoiceResponse]


class AdminUserResponse(BaseModel):
    id: int
    username: str
    role: Role = Field(default=Role.USER)
    mark: str = Field(default="")
    sub_url: str = Field(default="")

    class Config:
        from_attributes = True


class UpdateUserRoleRequest(BaseModel):
    role: Role


class UpdateUserRoleResponse(BaseModel):
    user: AdminUserResponse
    token: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: Role = Field(default=Role.USER)
    sub_url: str = Field(default="")

    class Config:
        from_attributes = True
