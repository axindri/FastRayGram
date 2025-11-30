import logging

import asyncpg

from src.settings import settings

logger = logging.getLogger(__name__)


class Database:
    def __init__(self) -> None:
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                host=settings.db.host,
                port=settings.db.port,
                user=settings.db.user,
                password=settings.db.password,
                database=settings.db.dbname,
                min_size=1,
                max_size=10,
            )
            logger.info("Database connection pool created successfully")

    async def ensure_pool(self) -> None:
        if self.pool is None:
            await self.connect()

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

    async def acquire(self):
        await self.ensure_pool()
        if self.pool is None:
            raise RuntimeError("Failed to create database pool")
        return self.pool.acquire()

    async def test_connection(self) -> int:
        async with await self.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            logger.info("Database connection test successful")
            return result


db = Database()
