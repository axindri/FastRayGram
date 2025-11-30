from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.core.enums import SocialNames


class SocialCreate(BaseModel):
    login: str
    name: SocialNames
    email: str | None = None
    user_id: UUID


class SocialFilter(BaseModel):
    login: str | None = None
    name: SocialNames | None = None
    email: str | None = None
    user_id: UUID | None = None


class SocialUpdate(BaseModel):
    email: str | None = None


class SocialResponse(BaseModel):
    id: UUID
    login: str | None = None
    name: SocialNames | None = None
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SocialInAccountProfileResponse(BaseModel):
    login: str | None = None
    name: SocialNames | None = None
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)
