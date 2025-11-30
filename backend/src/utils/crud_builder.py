from enum import Enum
from typing import Any, Awaitable, Callable, Type
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.dependencies.pagination import get_pagination
from src.models.base import Base
from src.schemas import CrudSchemas, IdFilter, MessageResponse, PagedResponse, Pagination
from src.services.crud import CrudService, DbService, get_crud_service, get_db_service


def create_crud_router(
    prefix: str,
    tags: list[str | Enum],
    model: Type[Base],
    schemas: CrudSchemas,
    custom_create_func: Callable[[DbService, Type[Base], BaseModel, type[BaseModel]], Awaitable[Any]] | None = None,
    disable_delete: bool = False,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=tags)

    entity_name = prefix.strip('/').lower().rstrip('s')

    create_func_name = f'create_{entity_name}'
    get_all_func_name = f'get_{entity_name}s'
    get_func_name = f'get_{entity_name}'
    update_func_name = f'update_{entity_name}'
    delete_func_name = f'delete_{entity_name}'

    # CREATE handler - only if create and response schemas are provided
    if schemas.create is not None and schemas.response is not None:

        async def create_handler(
            create_schema: schemas.create,  # type: ignore
            crud_service: CrudService = Depends(get_crud_service),
        ) -> schemas.response:  # type: ignore
            return await crud_service.create(model, create_schema, schemas.response)

        if custom_create_func:

            async def custom_create_handler(
                create_schema: schemas.create,  # type: ignore
                db_service: DbService = Depends(get_db_service),
            ) -> schemas.response:  # type: ignore
                return await custom_create_func(db_service, model, create_schema, schemas.response)

        create_handler.__name__ = create_func_name
        if custom_create_func:
            custom_create_handler.__name__ = create_func_name
            router.add_api_route('/', custom_create_handler, methods=['POST'])
        else:
            router.add_api_route('/', create_handler, methods=['POST'])

    # GET ALL handler - only if filter and response schemas are provided
    if schemas.filter is not None and schemas.response is not None:

        async def get_all_handler(
            filter_schema: schemas.filter = Depends(schemas.filter),  # type: ignore
            pagination: Pagination = Depends(get_pagination),
            crud_service: CrudService = Depends(get_crud_service),
        ) -> PagedResponse[schemas.response]:  # type: ignore
            return await crud_service.get_all(model, filter_schema, schemas.response, pagination)

        get_all_handler.__name__ = get_all_func_name
        router.add_api_route('/', get_all_handler, methods=['GET'])

    # GET handler - only if response schema is provided
    if schemas.response is not None:

        async def get_handler(
            id: UUID,
            crud_service: CrudService = Depends(get_crud_service),
        ) -> schemas.response:  # type: ignore
            return await crud_service.get_or_raise(model, IdFilter(id=id), schemas.response)

        get_handler.__name__ = get_func_name
        router.add_api_route('/{id}', get_handler, methods=['GET'])

    # UPDATE handler - only if update and response schemas are provided
    if schemas.update is not None and schemas.response is not None:

        async def update_handler(
            id: UUID,
            update_schema: schemas.update,  # type: ignore
            crud_service: CrudService = Depends(get_crud_service),
        ) -> schemas.response:  # type: ignore
            return await crud_service.update(model, id, update_schema, schemas.response)

        update_handler.__name__ = update_func_name
        router.add_api_route('/{id}', update_handler, methods=['PATCH'])

    # DELETE handler - only if disable_delete is False
    if not disable_delete:

        async def delete_handler(
            id: UUID,
            crud_service: CrudService = Depends(get_crud_service),
        ) -> MessageResponse:
            await crud_service.delete(model, id)
            return MessageResponse(msg='Success')

        delete_handler.__name__ = delete_func_name
        router.add_api_route('/{id}', delete_handler, methods=['DELETE'])

    return router
