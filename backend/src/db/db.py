import logging
import traceback
from asyncio import current_task
from typing import AsyncGenerator

from fastapi import HTTPException
from sqlalchemy.exc import DataError, IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_scoped_session, async_sessionmaker, create_async_engine

from src.core.exceptions import ObjectForeignKeyError, ObjectUniqueViolationError, UnexpectedError
from src.core.settings import settings
from src.models.base import Base

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, url: str, echo: bool = False):
        self.engine = create_async_engine(
            url=url,
            echo=echo,
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    def get_scoped_session(self) -> async_scoped_session[AsyncSession]:
        session = async_scoped_session(
            session_factory=self.session_factory,
            scopefunc=current_task,
        )
        return session

    async def session_dependency(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.session_factory() as session:
            try:
                logger.debug(f'v--- OPEN DB SESSION {id(session)} ---v')
                yield session
            except (SQLAlchemyError, IntegrityError, DataError) as e:
                await session.rollback()

                if 'uniqueviolationerror' in str(e).lower():
                    raise ObjectUniqueViolationError(context={'session_id': id(session)})
                elif 'foreignkeyviolationerror' in str(e).lower():
                    raise ObjectForeignKeyError(context={'session_id': id(session)})

                logger.error(f'Error in session {id(session)}: {e}\n{traceback.format_exc()}')
                raise UnexpectedError(context={'session_id': id(session)})

            except HTTPException:
                await session.rollback()
                raise

            except Exception as e:
                await session.rollback()
                logger.error(f'Error in session {id(session)}: {e}')
                raise

            finally:
                await session.close()
                logger.debug(f'^--- CLOSE DB SESSION {id(session)} ---^')

    async def scoped_session_dependency(self) -> AsyncGenerator[async_scoped_session[AsyncSession], None]:
        session = self.get_scoped_session()
        yield session
        await session.close()

    async def db_init(self) -> None:
        logger.info(f'Initializing database with {[table for table in Base.metadata.tables.keys()]}...')
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info('Database initialization completed!')

    async def db_close(self) -> None:
        await self.engine.dispose()
        logger.info('Database connection closed successfully')


database = Database(
    url=settings.db.url,
    echo=settings.db.echo,
)
