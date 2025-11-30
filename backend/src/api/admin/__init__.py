from fastapi import APIRouter

from src.api.admin.v1 import router as router_admin_v1

router = APIRouter(prefix='/admin')

router.include_router(router_admin_v1)
