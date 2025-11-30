from fastapi import APIRouter

from src.api.admin.v1.configs import router as configs_router
from src.api.admin.v1.entities import router as entities_router
from src.api.admin.v1.news import router as news_router
from src.api.admin.v1.notifications import router as notifications_router
from src.api.admin.v1.requests import router as requests_router
from src.api.admin.v1.sessions import router as sessions_router
from src.api.admin.v1.users import router as users_router
from src.api.admin.v1.xui import router as xui_router

router = APIRouter(prefix='/v1')

router.include_router(xui_router)
router.include_router(configs_router)
router.include_router(requests_router)
router.include_router(news_router)
router.include_router(entities_router)
router.include_router(notifications_router)
router.include_router(sessions_router)
router.include_router(users_router)
