from fastapi import APIRouter, Depends

from src.dependencies import get_current_token, get_current_user_id, get_pagination
from src.schemas import (
    AccountProfileResponse,
    NotificationResponse,
    PagedResponse,
    Pagination,
    ProfileUpdate,
    UserInToken,
)
from src.services import AuthService, get_auth_service

router = APIRouter(prefix='/account', tags=['account'])


@router.get('/profile')
async def get_profile(
    token: str = Depends(get_current_token),
    user_id: UserInToken = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
) -> AccountProfileResponse:
    return await service.user.get_profile(user_id, token)


@router.patch('/profile')
async def update_profile(
    profile_update: ProfileUpdate,
    token: str = Depends(get_current_token),
    user_id: UserInToken = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
) -> AccountProfileResponse:
    return await service.user.update_profile(user_id, profile_update, token)


@router.get('/notifications')
async def get_notifications(
    user_id: UserInToken = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
    pagination: Pagination = Depends(get_pagination),
) -> PagedResponse[NotificationResponse]:
    return await service.user.get_notifications(user_id, pagination)
