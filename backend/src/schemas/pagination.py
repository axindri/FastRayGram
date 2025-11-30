from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)


class Pagination(BaseModel):
    page: int
    limit: int


class PaginationParamsInResponse(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool


class PagedResponse(BaseModel, Generic[T]):
    pagination: PaginationParamsInResponse
    data: list[T]
