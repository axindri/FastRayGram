from uuid import UUID

from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.schemas import AccountProfileResponse, MessageResponse
from src.services import AdminService, AuthService, get_admin_service, get_auth_service

router = APIRouter(prefix='/users', tags=['users'])


@router.get(
    '/{user_id}/profile',
    dependencies=[Depends(required_role(UserRoles.ADMIN))],
)
async def get_user_account_profile(
    user_id: UUID,
    service: AuthService = Depends(get_auth_service),
) -> AccountProfileResponse:
    return await service.user.get_profile(user_id)


@router.post(
    '/{user_id}/verify',
    dependencies=[Depends(required_role(UserRoles.ADMIN))],
)
async def verify_user(
    user_id: UUID,
    service: AdminService = Depends(get_admin_service),
) -> MessageResponse:
    await service.verify_user(user_id)
    return MessageResponse(msg='Success')


@router.post(
    '/{user_id}/unverify',
    dependencies=[Depends(required_role(UserRoles.ADMIN))],
)
async def unverify_user(
    user_id: UUID,
    service: AdminService = Depends(get_admin_service),
) -> MessageResponse:
    await service.unverify_user(user_id)
    return MessageResponse(msg='Success')


@router.post(
    '/{user_id}/update/role',
    dependencies=[Depends(required_role(UserRoles.SUPERUSER))],
)
async def update_user_role(
    user_id: UUID,
    name: UserRoles = UserRoles.USER,
    admin_service: AdminService = Depends(get_admin_service),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await admin_service.update_user_role(user_id, name)
    await auth_service.session.terminate_all_sessions(user_id)
    return MessageResponse(msg='Success')


@router.post('/{user_id}/password/reset', dependencies=[Depends(required_role(UserRoles.SUPERUSER))])
async def reset_user_password(
    user_id: UUID,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    msg = await service.user.reset_password(user_id)
    await service.session.terminate_all_sessions(user_id)
    return MessageResponse(msg=msg)
