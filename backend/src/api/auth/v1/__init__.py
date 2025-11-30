from fastapi import APIRouter

from src.api.auth.v1.account import router as account_router
from src.api.auth.v1.auth import router as auth_router
from src.api.auth.v1.sessions import router as sessions_router

router = APIRouter(prefix='/v1')


router.include_router(auth_router)
router.include_router(account_router)
router.include_router(sessions_router)
