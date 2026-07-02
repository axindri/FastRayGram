from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from src.api.admin import router as admin_router
from src.api.frontend import register_frontend
from src.api.register import router as register_router
from src.api.root import router as root_router
from src.api.tw import router as tw_router
from src.api.user import router as user_router
from src.api.xui import router as xui_router
from src.core.cache import request_key_builder
from src.core.enums import ServiceStatus
from src.core.handlers import register_exception_handlers
from src.core.logger import logger
from src.core.settings import settings
from src.schemas import Base
from src.services.db import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    FastAPICache.init(
        InMemoryBackend(),
        prefix=settings.cache.namespace,
        key_builder=request_key_builder,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app.name,
    version=settings.app.version,
    lifespan=lifespan,
)

register_exception_handlers(app)

api_router = APIRouter(prefix="/api")
api_router.include_router(register_router)
api_router.include_router(root_router)
api_router.include_router(admin_router)
api_router.include_router(user_router)
api_router.include_router(tw_router)
api_router.include_router(xui_router)
app.include_router(api_router)
register_frontend(app)

init_msg = """
=========================
Fast Ray Gram API v%s
=========================
Debug: %s
Host: %s Port: %s
""" % (
    settings.app.version,
    settings.app.debug,
    settings.app.host,
    settings.app.port,
)

logger.info(init_msg)


@app.get("/api/health")
async def app_health() -> dict[str, ServiceStatus]:
    return {"status": ServiceStatus.OK}
