from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoleCreate(BaseModel):
    name: str
    weight: int


class RoleResponse(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class RoleFilter(BaseModel):
    name: str | None = None
