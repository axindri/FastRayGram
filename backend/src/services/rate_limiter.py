from datetime import datetime, timezone
from logging import getLogger

from fastapi import Depends, Request
from redis.asyncio import Redis

from src.core.exceptions import RateLimitError
from src.core.settings import settings
from src.db import redis_limiter_db
from src.schemas import RateLimitInfo
from src.utils import get_client_ip

logger = getLogger(__name__)


class RateLimitService:
    def __init__(self, client: Redis):
        self.client = client
        self.settings = settings.rate_limit

    def get_endpoint_path(self, request: Request) -> str:
        if hasattr(request, 'url') and request.url:
            return request.url.path
        return request.scope.get('path', 'unknown')

    def _get_identifier(self, request: Request) -> str:
        ip_address = get_client_ip(request)
        endpoint_path = self.get_endpoint_path(request)
        return f'ip:{ip_address}:path:{endpoint_path}'

    def _get_redis_key(self, identifier: str, window: str) -> str:
        return f'{"rate_limit"}:{identifier}:{window}'

    async def _check_limit(
        self, identifier: str, limit: int, window_seconds: int, window_name: str
    ) -> tuple[bool, RateLimitInfo]:
        current_time = int(datetime.now(timezone.utc).replace(tzinfo=None).timestamp())
        window_start = current_time - (current_time % window_seconds)

        key = self._get_redis_key(identifier, f'{window_name}:{window_start}')
        logger.debug(f'Checking limit for {key}')

        current_count = await self.client.get(key)
        current_count = int(current_count) if current_count else 0

        if current_count >= limit:
            ttl = await self.client.ttl(key)
            reset_time = window_start + window_seconds
            return False, RateLimitInfo(
                limit=limit,
                remaining=0,
                reset=reset_time,
                retry_after=ttl if ttl > 0 else window_seconds,
            )

        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        await pipe.execute()

        remaining = limit - current_count - 1
        reset_time = window_start + window_seconds
        return True, RateLimitInfo(
            limit=limit,
            remaining=remaining,
            reset=reset_time,
            retry_after=None,
        )

    async def check_rate_limit(
        self,
        request: Request,
        requests_per_minute: int | None = None,
    ) -> None:
        if not self.settings.enabled or get_client_ip(request) in self.settings.exclude_ip_addresses:
            return

        per_minute = requests_per_minute or self.settings.default_requests_per_minute
        allowed_minute, minute_info = await self._check_limit(self._get_identifier(request), per_minute, 60, 'minute')
        if not allowed_minute:
            raise RateLimitError(
                f'Rate limit exceeded for {self._get_identifier(request)} in minute window {per_minute} requests',
                'Too many requests',
                headers={
                    'X-RateLimit-Limit': str(minute_info.limit),
                    'X-RateLimit-Remaining': str(minute_info.remaining),
                    'X-RateLimit-Reset': str(minute_info.reset),
                    'Retry-After': str(minute_info.retry_after),
                },
            )


async def get_rate_limit_service(client: Redis = Depends(redis_limiter_db.client_dependency)) -> RateLimitService:
    return RateLimitService(client)
