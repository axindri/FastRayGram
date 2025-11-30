from fastapi import APIRouter

from src.api.app.v1 import router as app_router

router = APIRouter(prefix='/app', tags=['app'])

router.include_router(app_router)
