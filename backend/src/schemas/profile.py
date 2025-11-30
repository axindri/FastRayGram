import re
import unicodedata
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.core.enums import LangCodes
from src.schemas.role import RoleResponse
from src.schemas.session import SessionResponse
from src.schemas.social import SocialInAccountProfileResponse
from src.schemas.user import UserInAccountProfileResponse


def name_validator(v: str) -> str:
    pattern = r'^[a-zA-Zа-яА-ЯёЁ]{1,255}$'

    if not re.match(pattern, v):
        raise ValueError('Contains 1 to 255 characters consisting of English letters, Russian letters')
    return v.capitalize()


def sanitize_name(v: str | None) -> str | None:
    if not v:
        return None
    # Remove null bytes and control characters (except space, tab, newline)
    v = ''.join(char for char in v if unicodedata.category(char)[0] != 'C' or char in ' \t\n')
    # Normalize Unicode (NFKC - compatibility decomposition + composition)
    v = unicodedata.normalize('NFKC', v)
    # Strip whitespace
    v = v.strip()
    # Remove zero-width characters
    v = re.sub(r'[\u200b-\u200d\ufeff]', '', v)
    # Ensure it's not empty after sanitization
    return v if v else None


class ProfileInRegisterForm(BaseModel):
    first_name: str = Field(min_length=1, max_length=255)
    last_name: str | None = Field(None, min_length=1, max_length=255)
    lang_code: LangCodes = LangCodes.RU
    email: EmailStr | None = None

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        return name_validator(v)


class ProfileInRegisterSocialForm(BaseModel):
    first_name: str = Field(min_length=1, max_length=255)
    last_name: str | None = Field(None, max_length=255)
    lang_code: LangCodes = LangCodes.RU

    @field_validator('first_name', 'last_name')
    @classmethod
    def sanitize_names(cls, v: str | None) -> str | None:
        if v is None:
            return None
        sanitized = sanitize_name(v)
        if not sanitized:
            raise ValueError('Name cannot be empty after sanitization')
        return sanitized[:255]  # Ensure max length


class ProfileCreate(BaseModel):
    user_id: UUID
    first_name: str
    last_name: str | None = None
    lang_code: LangCodes
    email: str | None = None


class ProfileFilter(BaseModel):
    user_id: UUID | None = None
    first_name: str | None = None
    last_name: str | None = None
    lang_code: LangCodes | None = None
    email: str | None = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    first_name: str | None = None
    last_name: str | None = None
    lang_code: LangCodes | None = None
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProfileInAccountProfileResponse(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    lang_code: LangCodes | None = None
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    lang_code: LangCodes | None = None

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        return name_validator(v)


class AccountProfileResponse(BaseModel):
    user: UserInAccountProfileResponse
    profile: ProfileInAccountProfileResponse
    role: RoleResponse
    socials: list[SocialInAccountProfileResponse]
    sessions: list[SessionResponse]

    model_config = ConfigDict(from_attributes=True)
    model_config = ConfigDict(from_attributes=True)
