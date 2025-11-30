from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends
from sqlalchemy import delete

from src.core.enums import LangCodes, RelatedNames, RequestNames, RequestStatuses, UserRoles
from src.models import News as NewsModel
from src.models import Notification as NotificationModel
from src.models import Role as RoleModel
from src.models import User as UserModel
from src.schemas import NewsResponse, NotificationCreate, PagedResponse, Pagination, PaginationParamsInResponse
from src.services.db import DbService, get_db_service


@dataclass
class NotificationService:
    db: DbService

    async def _get_admin_users(self) -> list[UserModel]:
        async with self.db.transaction() as tx:
            superuser_role = await tx.db.get_or_raise(RoleModel, filter={'name': UserRoles.SUPERUSER})
            admin_role = await tx.db.get_or_raise(RoleModel, filter={'name': UserRoles.ADMIN})
            superuser = await tx.db.get_or_raise(UserModel, filter={'role_id': superuser_role.id})
            admins = await tx.db.get_all(UserModel, filter={'role_id': admin_role.id})
            return [superuser, *admins]

    async def create_user_notification(
        self,
        user_id: UUID,
        request_name: RequestNames,
        request_status: RequestStatuses,
        related_name: RelatedNames,
        related_id: UUID,
        title: dict[LangCodes, str],
        content: dict[LangCodes, str],
    ) -> bool:
        async with self.db.transaction() as tx:
            await tx.db.create(
                NotificationModel,
                NotificationCreate(
                    user_id=user_id,
                    request_name=request_name,
                    request_status=request_status,
                    related_name=related_name,
                    related_id=related_id,
                    title=title,
                    content=content,
                ).model_dump(),
            )
        return True

    async def create_admins_notification(
        self,
        request_name: RequestNames,
        request_status: RequestStatuses,
        related_name: RelatedNames,
        related_id: UUID,
        title: dict[LangCodes, str],
        content: dict[LangCodes, str],
    ) -> bool:
        admins = await self._get_admin_users()
        for admin in admins:
            await self.create_user_notification(
                admin.id,
                request_name,
                request_status,
                related_name,
                related_id,
                title,
                content,
            )
        return True

    async def cleanup_expired_notifications(self) -> int:
        process_time = datetime.now(timezone.utc).replace(tzinfo=None)
        one_month_ago = process_time - timedelta(days=30)
        async with self.db.transaction() as tx:
            query = delete(NotificationModel).where(NotificationModel._inserted_dttm < one_month_ago)
            result = await tx.db_session.execute(query)
            await tx.db_session.flush()
            return result.rowcount

    async def get_news(self, pagination: Pagination) -> PagedResponse[NewsResponse]:
        async with self.db.transaction() as tx:
            news = await tx.db.get_all(
                NewsModel,
                limit=pagination.limit,
                offset=(pagination.page - 1) * pagination.limit,
                order_by='_inserted_dttm',
                order_by_desc=True,
            )
            total = await tx.db.get_count(NewsModel)
            total_pages = (total + pagination.limit - 1) // pagination.limit if total > 0 else 0
            return PagedResponse[NewsResponse](
                pagination=PaginationParamsInResponse(
                    page=pagination.page,
                    limit=pagination.limit,
                    total=total,
                    total_pages=total_pages,
                    has_next=pagination.page < total_pages,
                ),
                data=[NewsResponse.model_validate(news_item) for news_item in news],
            )


async def get_notification_service(db: DbService = Depends(get_db_service)) -> NotificationService:
    return NotificationService(db=db)
