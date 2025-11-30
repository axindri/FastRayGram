from logging import getLogger

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from src.core.exceptions import RateLimitError
from src.core.settings import settings
from src.db import redis_limiter_db
from src.services.rate_limiter import RateLimitService

logger = getLogger(__name__)


class GlobalRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.rate_limit_service: RateLimitService | None = None

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore
        excluded_paths = [f'{settings.app.docs_path}', f'{settings.app.openapi_path}']
        if any(request.url.path.startswith(path) for path in excluded_paths):
            logger.debug(f'Skipping rate limiting for {request.url.path}')
            return await call_next(request)

        if not settings.rate_limit.enabled:
            return await call_next(request)

        if self.rate_limit_service is None:
            if not redis_limiter_db._is_initialized:
                await redis_limiter_db.initialize()
            self.rate_limit_service = RateLimitService(redis_limiter_db.client)
        try:
            await self.rate_limit_service.check_rate_limit(
                request, requests_per_minute=settings.rate_limit.default_requests_per_minute
            )
        except RateLimitError as e:
            return JSONResponse(
                status_code=e.status_code,
                content={'detail': e.detail},
                headers=e.headers,
            )

        response: Response = await call_next(request)
        return response
