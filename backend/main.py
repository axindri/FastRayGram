from contextlib import asynccontextmanager
from logging import getLogger
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.admin import router as admin_router
from src.api.app import router as app_router
from src.api.auth import router as auth_router
from src.api.backend import router as backend_router
from src.core.settings import settings
from src.middleware import GlobalRateLimitMiddleware, SecurityHeadersMiddleware
from src.utils import (
    close_db,
    close_redis,
    create_roles,
    create_settings,
    create_superuser,
    get_allowed_origins,
    init_db,
    init_redis,
)

logger = getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(
        'Starting app with params:\n- Debug mode: %s \n- Docs path: %s \n- Openapi path: %s',
        settings.app.debug,
        settings.app.docs_path,
        settings.app.openapi_path,
    )
    await init_db()
    await init_redis()
    await create_settings()
    await create_roles()
    await create_superuser()
    yield
    await close_redis()
    await close_db()


app = FastAPI(
    title=settings.app.title,
    description=settings.app.description,
    version=settings.app.version,
    docs_url=settings.app.docs_path,
    openapi_url=settings.app.openapi_path,
    lifespan=lifespan,
)

allowed_origins = get_allowed_origins(settings.app.allowed_domains)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GlobalRateLimitMiddleware)

app.include_router(app_router)
app.include_router(auth_router)
app.include_router(backend_router)
app.include_router(admin_router)
