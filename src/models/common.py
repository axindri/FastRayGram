from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = Field(ge=1)
    limit: int = Field(ge=1)
    pages: int = Field(ge=1)


def build_paginated_response(items: list[T], total: int, page: int, limit: int) -> PaginatedResponse[T]:
    pages = max(1, ceil(total / limit)) if total else 1
    safe_page = min(max(page, 1), pages)
    return PaginatedResponse(items=items, total=total, page=safe_page, limit=limit, pages=pages)
