from logging import getLogger
from typing import Any, Callable, Coroutine

from fastapi import Depends, Request

from src.core.settings import settings
from src.services.rate_limiter import RateLimitService, get_rate_limit_service

logger = getLogger(__name__)


def custom_rate_limit(
    requests_per_minute: int = settings.rate_limit.default_requests_per_minute,
) -> Callable[[Request], Coroutine[Any, Any, None]]:
    async def dependency(
        request: Request, rate_limit_service: RateLimitService = Depends(get_rate_limit_service)
    ) -> None:
        return await rate_limit_service.check_rate_limit(request, requests_per_minute=requests_per_minute)

    return dependency
