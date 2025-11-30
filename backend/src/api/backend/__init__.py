from fastapi import APIRouter

from src.api.backend.v1 import router as router_backend_v1

router = APIRouter(prefix='/backend')

router.include_router(router_backend_v1)
