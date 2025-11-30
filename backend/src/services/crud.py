from dataclasses import dataclass
from typing import Any, TypeVar
from uuid import UUID

from fastapi import Depends
from pydantic import BaseModel

from src.models.base import Base
from src.schemas import PagedResponse, Pagination, PaginationParamsInResponse
from src.services.db import DbService, get_db_service

DBModel = TypeVar('DBModel', bound=Base)
Response_schema = TypeVar('Response_schema', bound=BaseModel)
Input_schema = TypeVar('Input_schema', bound=BaseModel)
Filter_schema = TypeVar('Filter_schema', bound=BaseModel)


@dataclass
class CrudService:
    db: DbService

    async def create(
        self, db_model: type[DBModel], input_schema: Input_schema, response_schema: type[Response_schema]
    ) -> Response_schema:
        async with self.db.transaction() as tx:
            obj = await tx.db.create(db_model, input_schema.model_dump())
            return response_schema.model_validate(obj)

    async def get(
        self, db_model: type[DBModel], filter: dict[str, Any] | Filter_schema, response_schema: type[Response_schema]
    ) -> Response_schema | None:
        async with self.db.transaction() as tx:
            obj = await tx.db.get(
                db_model, filter.model_dump(exclude_none=True) if isinstance(filter, BaseModel) else filter
            )
            return response_schema.model_validate(obj)

    async def get_or_raise(
        self, db_model: type[DBModel], filter: dict[str, Any] | Filter_schema, response_schema: type[Response_schema]
    ) -> Response_schema:
        async with self.db.transaction() as tx:
            obj = await tx.db.get_or_raise(
                db_model, filter.model_dump(exclude_none=True) if isinstance(filter, BaseModel) else filter
            )
            return response_schema.model_validate(obj)

    async def get_all(
        self,
        db_model: type[DBModel],
        filter: dict[str, Any] | Filter_schema,
        response_schema: type[Response_schema],
        pagination: Pagination,
    ) -> PagedResponse[Response_schema]:
        async with self.db.transaction() as tx:
            objs = await tx.db.get_all(
                db_model,
                filter.model_dump(exclude_none=True) if isinstance(filter, BaseModel) else filter,
                limit=pagination.limit,
                offset=(pagination.page - 1) * pagination.limit,
                order_by='_inserted_dttm',
            )
            total = await tx.db.get_count(
                db_model, filter.model_dump(exclude_none=True) if isinstance(filter, BaseModel) else filter
            )
            total_pages = (total + pagination.limit - 1) // pagination.limit if total > 0 else 0
            return PagedResponse[Response_schema](
                pagination=PaginationParamsInResponse(
                    page=pagination.page,
                    limit=pagination.limit,
                    total=total,
                    total_pages=total_pages,
                    has_next=pagination.page < total_pages,
                ),
                data=[response_schema.model_validate(obj) for obj in objs],
            )

    async def update(
        self, db_model: type[DBModel], id: UUID, input_schema: Input_schema, response_schema: type[Response_schema]
    ) -> Response_schema:
        async with self.db.transaction() as tx:
            obj = await tx.db.update(db_model, id, input_schema.model_dump(exclude_none=True))
            return response_schema.model_validate(obj)

    async def delete(self, db_model: type[DBModel], id: UUID) -> UUID:
        async with self.db.transaction() as tx:
            return await tx.db.delete(db_model, id)


async def get_crud_service(db: DbService = Depends(get_db_service)) -> CrudService:
    return CrudService(db)
