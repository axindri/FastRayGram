from fastapi import APIRouter

from src.api.backend.v1.configs import router as configs_router
from src.api.backend.v1.news import router as news_router

router = APIRouter(prefix='/v1')


router.include_router(news_router)
router.include_router(configs_router)
