from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user
from src.core.enums import Role
from src.models.notifications import NotificationResponse
from src.models.users import UserProfileResponse
from src.models.xui import ClientResponse
from src.schemas.users import User
from src.services.db import get_db
from src.services.notifications import NotificationService, get_notification_service
from src.services.users import UserService, get_user_service

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me")
async def get_me(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    if user.role == Role.SUPERUSER:
        return UserProfileResponse(
            id=0,
            username=Role.SUPERUSER,
            role=Role.SUPERUSER,
            sub_url="",
            invoices=[],
        )
    return await user_service.get_user_profile_by_id(db, user.id)


@router.get("/xui-me")
async def get_xui_me(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> ClientResponse:
    return await user_service.get_xui_user_profile_by_id(db, user.id)


@router.post("/refresh-token")
async def refresh_my_token(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> str:
    if user.role == Role.SUPERUSER:
        raise HTTPException(status_code=400, detail="Superuser token cannot be refreshed")
    return await user_service.refresh_token(db, user.id)


@router.get("/notifications")
async def list_my_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service),
) -> list[NotificationResponse]:
    if user.role == Role.SUPERUSER:
        return []
    return await notification_service.list_for_user(db, user.id)
