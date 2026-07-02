from collections.abc import AsyncGenerator

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from src.core.settings import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.database.url,
    echo=False,
    poolclass=NullPool,
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
        except Exception as e:
            await session.rollback()
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=400, detail="Unique constraint violation")
            raise e
        finally:
            await session.close()
