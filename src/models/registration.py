from datetime import datetime

from pydantic import BaseModel, Field

from src.core.settings import settings
from src.models.fields import RequiredMark, Username


class CreateRegistrationCodeRequest(BaseModel):
    valid_days: int = Field(default=7, ge=1, le=365)
    max_registrations: int = Field(
        default=settings.app.default_registration_code_max_uses,
        ge=0,
        le=10_000,
    )


class ExtendRegistrationCodeRequest(BaseModel):
    extend_days: int = Field(ge=1, le=365)


class RegistrationCodeResponse(BaseModel):
    id: int
    code: str
    expires_at: datetime
    max_registrations: int
    registrations_count: int = 0
    enable: bool
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    code: str
    username: Username
    mark: RequiredMark


class RegisterValidationResponse(BaseModel):
    valid: bool
    expires_at: datetime | None = None
    registration_expiry_days: int
