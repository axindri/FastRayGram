from uuid import UUID

from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.schemas import MessageResponse
from src.services.admin import AdminService, get_admin_service

router = APIRouter(prefix='/requests', tags=['requests'], dependencies=[Depends(required_role(UserRoles.ADMIN))])


@router.post('/{request_id}/apply')
async def apply_request(
    request_id: UUID,
    service: AdminService = Depends(get_admin_service),
) -> MessageResponse:
    msg = await service.apply_request(request_id)
    return MessageResponse(msg=msg)


@router.post('/{request_id}/deny')
async def deny_request(
    request_id: UUID,
    service: AdminService = Depends(get_admin_service),
) -> MessageResponse:
    await service.deny_request(request_id)
    return MessageResponse(msg='Success')
