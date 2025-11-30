import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.core.enums import UserStatuses
from src.schemas.mixins import UUIDMixin


class UserRegisterForm(BaseModel):
    login: str = Field(min_length=6, max_length=20)
    password: str = Field(min_length=6, max_length=255)

    @field_validator('login')
    @classmethod
    def validate_login(cls, v: str) -> str:
        pattern = r'^[a-zA-Z][a-zA-Z0-9_]{5,19}$'

        if not re.match(pattern, v):
            raise ValueError('Starts with a letter, followed by 6 to 20 alphanumeric characters or underscores')
        return v


class UserChangePasswordForm(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=255)


class UserRegisterSocialForm(BaseModel):
    login: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=6, max_length=255)


class UserCreate(BaseModel):
    login: str
    password: str
    role_id: UUID


class UserUpdate(BaseModel):
    role_id: UUID | None = None
    status: UserStatuses | None = None


class UserResponse(BaseModel):
    id: UUID | None = None
    login: str | None = None
    role_id: UUID | None = None
    status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserInAccountProfileResponse(BaseModel):
    id: UUID | None = None
    login: str | None = None
    status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserFilter(BaseModel):
    login: str | None = None
    status: UserStatuses | None = None


class UserDataInToken(BaseModel):
    role: str


class UserInToken(UserDataInToken, UUIDMixin):
    model_config = ConfigDict(from_attributes=True)
