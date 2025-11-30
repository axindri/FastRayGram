from fastapi import APIRouter

from src.api.auth.v1 import router as router_auth_v1

router = APIRouter(prefix='/auth')

router.include_router(router_auth_v1)
