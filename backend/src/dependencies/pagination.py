from fastapi import Query

from src.schemas import Pagination


def get_pagination(
    page: int = Query(1, ge=1, le=100, description='Page number'),
    limit: int = Query(10, ge=1, le=50, description='Items per page'),
) -> Pagination:
    return Pagination(page=page, limit=limit)
