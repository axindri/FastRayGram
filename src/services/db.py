from collections.abc import AsyncGenerator

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.core.settings import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.database.url,
    echo=settings.app.debug,
    pool_size=3,
    max_overflow=2,
    pool_pre_ping=True,
    connect_args={"ssl": False},
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        except IntegrityError as error:
            await session.rollback()
            sqlstate = getattr(getattr(error, "orig", None), "sqlstate", None)
            if sqlstate == "23505":
                raise HTTPException(status_code=400, detail="Unique constraint violation") from error
            raise
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
