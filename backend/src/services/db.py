from contextlib import asynccontextmanager
from datetime import datetime, timezone
from logging import getLogger
from typing import Any, AsyncGenerator, Sequence, TypeVar
from uuid import UUID, uuid4

from fastapi import Depends
from sqlalchemy import delete, desc, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.core.exceptions import ObjectNotFoundError
from src.db import database
from src.models.base import Base

logger = getLogger(__name__)

DBModel = TypeVar('DBModel', bound=Base)


class DbRepository:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def ping(self) -> bool:
        await self.db_session.execute(text('SELECT 1'))
        return True

    async def get(self, db_model: type[DBModel], filter: dict[str, Any] | None) -> DBModel | None:
        resp = await self.db_session.execute(
            (select(db_model).filter_by(**filter) if filter else select(db_model)).limit(1)
        )
        return resp.scalar_one_or_none()

    async def get_or_raise(self, db_model: type[DBModel], filter: dict[str, Any] | None) -> DBModel:
        resp = await self.db_session.execute(
            (select(db_model).filter_by(**filter) if filter else select(db_model)).limit(1)
        )
        obj = resp.scalar_one_or_none()
        if not obj:
            raise ObjectNotFoundError(object_name=db_model.__tablename__)
        return obj

    async def get_or_raise_with_related(
        self, db_model: type[DBModel], filter: dict[str, Any] | None, with_related: list[str]
    ) -> DBModel:
        related_attrs = [getattr(db_model, attr) for attr in with_related]
        resp = await self.db_session.execute(
            (select(db_model).filter_by(**filter) if filter else select(db_model))
            .options(joinedload(*related_attrs))
            .limit(1)
        )
        obj = resp.unique().scalar_one_or_none()
        if not obj:
            raise ObjectNotFoundError(object_name=db_model.__tablename__)
        return obj

    async def get_by_id(self, db_model: type[DBModel], id: UUID) -> DBModel | None:
        resp = await self.db_session.execute(select(db_model).where(db_model.id == id).limit(1))
        obj = resp.scalar_one_or_none()
        return obj

    async def get_by_id_or_raise(self, db_model: type[DBModel], id: UUID) -> DBModel:
        resp = await self.db_session.execute(select(db_model).where(db_model.id == id).limit(1))
        obj = resp.scalar_one_or_none()
        if not obj:
            raise ObjectNotFoundError(object_name=db_model.__tablename__)
        return obj

    async def get_count(self, db_model: type[DBModel], filter: dict[str, Any] | None = None) -> int:
        query = select(func.count()).select_from(db_model)
        if filter:
            query = query.filter_by(**filter)
        resp = await self.db_session.execute(query)
        return resp.scalar_one()

    async def get_all(
        self,
        db_model: type[DBModel],
        filter: dict[str, Any] | None = None,
        limit: int = 100,
        offset: int = 0,
        order_by: str | None = None,
        order_by_desc: bool = False,
    ) -> Sequence[DBModel]:
        query = select(db_model)
        if filter:
            query = query.filter_by(**filter)
        if order_by:
            column = getattr(db_model, order_by)
            if order_by_desc:
                query = query.order_by(desc(column))
            else:
                query = query.order_by(column)
        query = query.limit(limit)
        query = query.offset(offset)
        res = await self.db_session.execute(query)
        return res.scalars().all()

    async def create(self, db_model: type[DBModel], data: dict[str, Any], id: UUID | None = None) -> DBModel:
        obj = db_model(**data)
        id_from_data = data.get('id')
        if id:
            obj.id = id
        elif id_from_data:
            obj.id = id_from_data
        else:
            obj.id = uuid4()
        self.db_session.add(obj)
        await self.db_session.flush()
        return obj

    async def update(self, db_model: type[DBModel], id: UUID, data: dict[str, Any]) -> DBModel:
        obj = await self.get_by_id_or_raise(db_model, id)
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        if not hasattr(obj, '_updated_dttm'):
            setattr(obj, '_updated_dttm', datetime.now(timezone.utc).replace(tzinfo=None))
        self.db_session.add(obj)
        await self.db_session.flush()

        return obj

    async def update_all(
        self,
        db_model: type[DBModel],
        data: dict[str, Any],
        filter: dict[str, Any],
        exclude_filter: dict[str, Any] | None = None,
    ) -> Sequence[DBModel]:
        query = update(db_model).filter_by(**filter)

        if exclude_filter:
            for key, value in exclude_filter.items():
                if hasattr(db_model, key) and value:
                    column = getattr(db_model, key)
                    query = query.where(column != value)

        await self.db_session.execute(
            query.values(**data, _updated_dttm=datetime.now(timezone.utc).replace(tzinfo=None))
        )
        await self.db_session.flush()
        return await self.get_all(db_model, filter)

    async def bulk_update_by_filter(
        self, db_model: type[DBModel], filter: dict[str, Any], data: dict[str, Any]
    ) -> Sequence[DBModel]:
        objs = await self.get_all(db_model, filter)
        for obj in objs:
            for key, value in data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)
            setattr(obj, '_updated_dttm', datetime.now(timezone.utc).replace(tzinfo=None))

        self.db_session.add_all(objs)
        await self.db_session.flush()

        return objs

    async def delete(self, db_model: type[DBModel], id: UUID) -> UUID:
        obj = await self.get_by_id_or_raise(db_model, id)
        del_id = obj.id
        await self.db_session.delete(obj)
        await self.db_session.flush()
        return del_id

    async def delete_by_filter(
        self,
        db_model: type[DBModel],
        filter: dict[str, Any] | None = None,
        where_conditions: list | None = None,
    ) -> int:
        if not filter and not where_conditions:
            raise ValueError('Filter or where_conditions must be provided')

        query = delete(db_model)

        if filter:
            query = query.filter_by(**filter)

        if where_conditions:
            for condition in where_conditions:
                query = query.where(condition)

        result = await self.db_session.execute(query)
        await self.db_session.flush()
        return result.rowcount


class DbService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.db = DbRepository(db_session)

    async def commit(self) -> None:
        logger.debug('Commit session %s', id(self.db_session))
        await self.db_session.commit()

    async def rollback(self) -> None:
        logger.debug('Rollback session %s', id(self.db_session))
        await self.db_session.rollback()

    async def flush(self) -> None:
        logger.debug('flush session %s', id(self.db_session))
        await self.db_session.flush()

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator['DbService', None]:
        try:
            yield self
            await self.commit()
        except Exception:
            await self.rollback()
            raise


async def get_db_service(db_session: AsyncSession = Depends(database.session_dependency)) -> DbService:
    return DbService(db_session)
