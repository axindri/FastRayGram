from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from src.core.enums import TokenTypes


class JwtDataInToken(BaseModel):
    type: TokenTypes
    sub: str
    data: dict[str, Any] | None = None
    exp: int


class JwtTokenPair(BaseModel):
    access: str
    refresh: str


class JwtRefreshTokenCreate(BaseModel):
    token: str
    user_id: UUID
    session_id: UUID
    expires_at: datetime
    is_active: bool
