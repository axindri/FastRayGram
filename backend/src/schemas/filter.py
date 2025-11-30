from uuid import UUID

from pydantic import BaseModel


class IdFilter(BaseModel):
    id: UUID
