from uuid import UUID

from fastapi import APIRouter, Depends

from src.core.enums import ConfigTypes, UserRoles
from src.dependencies import get_current_user_id, get_pagination, required_role, required_verified_user
from src.schemas import (
    ConfigRequestLimitsUpdate,
    ConfigResponse,
    ConfigSimpleResponse,
    MessageResponse,
    PagedResponse,
    Pagination,
    UserInToken,
)
from src.services import ConfigService, get_config_service

router = APIRouter(
    prefix='/client',
    tags=['client'],
    dependencies=[Depends(required_role(UserRoles.USER)), Depends(required_verified_user)],
)


@router.get('/configs')
async def get_configs_simple(
    pagination: Pagination = Depends(get_pagination),
    user_id: UUID = Depends(get_current_user_id),
    service: ConfigService = Depends(get_config_service),
) -> PagedResponse[ConfigSimpleResponse]:
    return await service.get_configs_simple(pagination, user_id)


# TODO: add caching for config response
@router.get('/configs/by-type/{type}')
async def get_config_by_type(
    user_id: UUID = Depends(get_current_user_id),
    type: ConfigTypes = ConfigTypes.VLESS,
    service: ConfigService = Depends(get_config_service),
) -> ConfigResponse:
    return await service.get_or_create_config(user_id, type)


@router.post('/configs/{config_id}/renew')
async def renew_config(
    config_id: UUID,
    user_id: UserInToken = Depends(get_current_user_id),
    service: ConfigService = Depends(get_config_service),
) -> MessageResponse:
    await service.create_renew_request(user_id, config_id)
    return MessageResponse(msg='Success')


@router.post('/configs/{config_id}/update-limits')
async def update_config_limits(
    config_id: UUID,
    limits_update: ConfigRequestLimitsUpdate,
    user_id: UserInToken = Depends(get_current_user_id),
    service: ConfigService = Depends(get_config_service),
) -> MessageResponse:
    await service.create_update_limits_request(user_id, config_id, limits_update)
    return MessageResponse(msg='Success')
