from logging import getLogger

from fastapi import Depends
from redis.asyncio import Redis

from src.db import redis_db, redis_limiter_db

logger = getLogger(__name__)


class RedisService:
    def __init__(self, client: Redis):
        self.client = client

    async def ping(self) -> bool:
        await self.client.ping()
        return True

    async def set_with_ttl(self, key: str, value: str | int, ttl: int) -> bool:
        logger.debug('Set to redis token: %s with ttl: %s sec', key, ttl)
        return bool(await self.client.setex(key, ttl, str(value)))

    async def delete(self, key: str) -> None:
        await self.client.delete(key)
        logger.debug('Delete redis token: %s', key)

    async def delete_by_pattern(self, pattern: str, exclude_key: str | None = None) -> int:
        deleted_count = 0
        cursor = 0
        while True:
            cursor, keys = await self.client.scan(cursor, match=pattern, count=1000)

            if keys:
                if exclude_key and exclude_key in keys:
                    keys = [key for key in keys if key != exclude_key]
                    logger.debug('Excluded key from deletion: %s', exclude_key)

                if keys:
                    deleted = await self.client.delete(*keys)
                    deleted_count += deleted
                    logger.debug('Deleted %d keys matching pattern: %s', deleted, pattern)

            if cursor <= 0:
                break

        logger.debug('Total deleted keys for pattern "%s": %d', pattern, deleted_count)
        return deleted_count

    async def verify(self, key: str) -> bool:
        resp = await self.client.exists(key)
        if resp > 0:
            logger.debug('Existed redis token: %s', key)
            return True
        else:
            logger.debug('No such redis token: %s', key)
            return False


async def get_redis_service(client: Redis = Depends(redis_db.client_dependency)) -> RedisService:
    return RedisService(client)


async def get_rate_limiter_redis_service(client: Redis = Depends(redis_limiter_db.client_dependency)) -> RedisService:
    return RedisService(client)
