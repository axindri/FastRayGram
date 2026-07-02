import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.core.logger import logger


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


async def http_exception_handler(request: Request, exc: httpx.ConnectTimeout) -> JSONResponse:
    logger.exception(
        "HTTP exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "Service Unavailable"},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.add_exception_handler(httpx.ConnectTimeout, http_exception_handler)
