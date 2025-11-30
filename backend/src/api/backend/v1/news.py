from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import get_pagination, required_role
from src.schemas import NewsResponse, PagedResponse, Pagination
from src.services import NotificationService, get_notification_service

router = APIRouter(prefix='/news', tags=['news'])


@router.get('', dependencies=[Depends(required_role(UserRoles.USER))])
async def get_news(
    service: NotificationService = Depends(get_notification_service),
    pagination: Pagination = Depends(get_pagination),
) -> PagedResponse[NewsResponse]:
    return await service.get_news(pagination)
