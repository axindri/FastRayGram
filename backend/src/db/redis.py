import logging
from typing import AsyncGenerator

import redis.asyncio as redis
from fastapi import HTTPException
from redis.asyncio import ConnectionPool, Redis
from redis.exceptions import ConnectionError, RedisError, TimeoutError

from src.core.exceptions import UnexpectedError
from src.core.settings import settings

logger = logging.getLogger(__name__)


class RedisDb:
    def __init__(self, host: str, port: int, username: str, password: str, db: int, max_connections: int = 10):
        self.pool = ConnectionPool(
            host=host,
            port=port,
            username=username,
            password=password,
            db=db,
            max_connections=max_connections,
            decode_responses=True,
        )
        self.client = redis.Redis(connection_pool=self.pool)
        self._is_initialized = False

    async def initialize(self) -> None:
        """Initialize Redis connection pool once"""
        if not self._is_initialized:
            try:
                await self.client.ping()
                self._is_initialized = True
                logger.info(f'Redis connection pool initialized for db {self.pool.connection_kwargs.get("db", 0)}')
            except (ConnectionError, TimeoutError, RedisError) as e:
                logger.error(f'Failed to initialize Redis connection: {e}')
                raise UnexpectedError(f'Redis connection initialization failed: {str(e)}')
            except Exception as e:
                logger.error(f'Unexpected error during Redis initialization: {e}')
                raise UnexpectedError(f'Redis connection initialization failed: {str(e)}')

    async def close(self) -> None:
        """Close Redis connection pool on app shutdown"""
        if self._is_initialized:
            try:
                await self.pool.disconnect()
                self._is_initialized = False
                logger.info(f'Redis connection pool closed for db {self.pool.connection_kwargs.get("db", 0)}')
            except (ConnectionError, TimeoutError, RedisError) as e:
                logger.error(f'Error closing Redis connection: {e}')
            except Exception as e:
                logger.error(f'Unexpected error closing Redis connection: {e}')

    async def client_dependency(self) -> AsyncGenerator[Redis, None]:
        """Dependency that yields Redis client - NO connection closing here!"""
        if not self._is_initialized:
            await self.initialize()

        try:
            logger.debug(f'v--- USING REDIS CONNECTION {id(self.pool)} ---v')
            yield self.client
        except HTTPException:
            raise
        except (ConnectionError, TimeoutError, RedisError) as e:
            logger.error('Redis connection error: %s', str(e))
            raise UnexpectedError(f'Redis connection error: {str(e)}')
        finally:
            logger.debug(f'^--- RELEASED REDIS CONNECTION {id(self.pool)} ---^')


redis_db = RedisDb(
    host=settings.redis.host,
    port=settings.redis.port,
    username=settings.redis.user,
    password=settings.redis.user_password,
    db=settings.redis.db_number,
    max_connections=settings.redis.max_connections,
)

redis_limiter_db = RedisDb(
    host=settings.rate_limit.host,
    port=settings.redis.port,
    username=settings.rate_limit.user,
    password=settings.rate_limit.user_password,
    db=settings.rate_limit.db_number,
    max_connections=settings.rate_limit.max_connections,
)
