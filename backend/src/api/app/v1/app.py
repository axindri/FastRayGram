from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.schemas import AppSettingsJsonResponse, AppSettingsJsonUpdate, AppStatusResponse
from src.services import AppService, get_app_service
from src.services.status import StatusService, get_status_service
from src.utils import get_required_role_doc

router = APIRouter()


@router.get('/health')
async def health(
    service: StatusService = Depends(get_status_service),
) -> AppStatusResponse:
    return await service.get_status()


@router.get(
    '/settings',
    dependencies=[Depends(required_role(UserRoles.USER))],
)
async def get_settings(
    service: AppService = Depends(get_app_service),
) -> AppSettingsJsonResponse:
    return await service.get_settings()


@router.patch(
    '/settings',
    dependencies=[Depends(required_role(UserRoles.SUPERUSER))],
    description=get_required_role_doc(UserRoles.SUPERUSER),
)
async def update_settings(
    settings_update: AppSettingsJsonUpdate,
    service: AppService = Depends(get_app_service),
) -> AppSettingsJsonResponse:
    return await service.update_settings(settings_update)
