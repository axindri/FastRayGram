from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.schemas import MessageResponse
from src.services import NotificationService, get_notification_service

router = APIRouter(
    prefix='/notifications', tags=['notifications'], dependencies=[Depends(required_role(UserRoles.ADMIN))]
)


@router.post('/cleanup')
async def cleanup_expired_notifications(
    service: NotificationService = Depends(get_notification_service),
) -> MessageResponse:
    cleaned_count = await service.cleanup_expired_notifications()
    return MessageResponse(msg=f'Cleaned up {cleaned_count} expired notifications', cleaned_count=str(cleaned_count))
