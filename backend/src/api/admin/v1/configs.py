from uuid import UUID

from fastapi import APIRouter, Depends, Query

from src.core.enums import UserRoles
from src.core.settings import settings
from src.dependencies import required_role
from src.schemas import ConfigResponse
from src.services import AdminService, get_admin_service

router = APIRouter(tags=['configs'], dependencies=[Depends(required_role(UserRoles.ADMIN))])


@router.post('/configs/{config_id}/time/add')
async def add_config_time(
    config_id: UUID,
    days: int = Query(default=settings.app.expiry_days, ge=0, le=90),
    hours: int = Query(default=0, ge=0, le=23),
    service: AdminService = Depends(get_admin_service),
) -> ConfigResponse:
    return await service.add_config_days(config_id, days, hours)


@router.post('/configs/{config_id}/time/remove')
async def remove_config_time(
    config_id: UUID,
    days: int = Query(default=settings.app.expiry_days, ge=0, le=90),
    hours: int = Query(default=0, ge=0, le=23),
    service: AdminService = Depends(get_admin_service),
) -> ConfigResponse:
    return await service.remove_config_days(config_id, days, hours)
