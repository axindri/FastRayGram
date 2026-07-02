import hashlib
from collections.abc import Awaitable, Callable
from typing import Any, ParamSpec, TypeVar

from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache as fastapi_cache
from fastapi_cache.types import KeyBuilder
from starlette.requests import Request
from starlette.responses import Response

from src.core.settings import settings

P = ParamSpec("P")
R = TypeVar("R")

# Headers that affect response representation (HTTP Vary-style), not auth.
VARY_HEADERS = ("accept", "accept-language", "accept-encoding")


def request_key_builder(
    func: Callable[..., Any],
    namespace: str = "",
    *,
    request: Request | None = None,
    response: Response | None = None,
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
) -> str:
    if request is None:
        digest = hashlib.md5(f"{func.__module__}:{func.__name__}".encode(), usedforsecurity=False).hexdigest()
        return f"{namespace}:{digest}"

    parts = [request.method, request.url.path]

    if request.query_params:
        parts.append(str(sorted(request.query_params.multi_items())))

    for header in VARY_HEADERS:
        value = request.headers.get(header)
        if value:
            parts.append(f"{header}={value}")

    # POST/PUT/PATCH body is not read here; only GET routes are cached by fastapi-cache2.
    digest = hashlib.md5("|".join(parts).encode(), usedforsecurity=False).hexdigest()
    return f"{namespace}:{digest}"


def app_cache(
    *,
    expire: int | None = None,
    key_builder: KeyBuilder | None = None,
) -> Callable[[Callable[P, Awaitable[R]]], Callable[P, Awaitable[R]]]:
    ttl = settings.cache.default_ttl_seconds if expire is None else expire

    def decorator(func: Callable[P, Awaitable[R]]) -> Callable[P, Awaitable[R]]:
        return fastapi_cache(expire=ttl, key_builder=key_builder)(func)

    return decorator


async def invalidate_all_cache() -> int:
    return await FastAPICache.clear(namespace=settings.cache.namespace)
