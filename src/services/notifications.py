from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.notifications import (
    CreateNotificationRequest,
    NotificationResponse,
    UpdateNotificationRequest,
)
from src.schemas.notifications import Notification
from src.schemas.users import User


@dataclass
class NotificationService:
    async def list_for_user(self, db: AsyncSession, user_id: int) -> list[NotificationResponse]:
        result = await db.execute(
            select(Notification, User.username)
            .join(User, User.id == Notification.user_id)
            .where(Notification.user_id == user_id)
            .order_by(Notification.id.desc())
        )
        rows = result.all()
        return [
            NotificationResponse(
                id=notification.id,
                user_id=notification.user_id,
                username=username,
                title=notification.title,
                body=notification.body,
                created_at=notification.created_at,
                updated_at=notification.updated_at,
            )
            for notification, username in rows
        ]

    async def list_all(
        self,
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[NotificationResponse], int, int]:
        total = await db.scalar(select(func.count()).select_from(Notification)) or 0
        offset = (max(1, page) - 1) * limit

        result = await db.execute(
            select(Notification, User.username)
            .join(User, User.id == Notification.user_id)
            .order_by(Notification.id.desc())
            .offset(offset)
            .limit(limit)
        )
        items = [
            NotificationResponse(
                id=notification.id,
                user_id=notification.user_id,
                username=username,
                title=notification.title,
                body=notification.body,
                created_at=notification.created_at,
                updated_at=notification.updated_at,
            )
            for notification, username in result.all()
        ]
        return items, total, page

    async def create(self, db: AsyncSession, payload: CreateNotificationRequest) -> NotificationResponse:
        user = await self._get_user_by_username(db, payload.username)
        notification = Notification(
            user_id=user.id,
            title=payload.title.strip(),
            body=payload.body.strip(),
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return NotificationResponse(
            id=notification.id,
            user_id=notification.user_id,
            username=user.username,
            title=notification.title,
            body=notification.body,
            created_at=notification.created_at,
            updated_at=notification.updated_at,
        )

    async def update(
        self,
        db: AsyncSession,
        notification_id: int,
        payload: UpdateNotificationRequest,
    ) -> NotificationResponse:
        notification = await self._get_by_id(db, notification_id)
        username = await self._username_for(db, notification.user_id)

        if payload.title is not None:
            notification.title = payload.title.strip()
        if payload.body is not None:
            notification.body = payload.body.strip()

        await db.commit()
        await db.refresh(notification)
        return NotificationResponse(
            id=notification.id,
            user_id=notification.user_id,
            username=username,
            title=notification.title,
            body=notification.body,
            created_at=notification.created_at,
            updated_at=notification.updated_at,
        )

    async def _get_by_id(self, db: AsyncSession, notification_id: int) -> Notification:
        result = await db.execute(select(Notification).where(Notification.id == notification_id))
        notification = result.scalar_one_or_none()
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        return notification

    async def _get_user_by_username(self, db: AsyncSession, username: str) -> User:
        result = await db.execute(select(User).where(User.username == username.strip()))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def _username_for(self, db: AsyncSession, user_id: int) -> str:
        result = await db.execute(select(User.username).where(User.id == user_id))
        return result.scalar_one_or_none() or ""


def get_notification_service() -> NotificationService:
    return NotificationService()
