from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Notification(Base):
    __tablename__ = 'notification'

    title: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # Adressee
    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'), nullable=False)

    # Request parameters
    request_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # enums.RequestNames
    request_status: Mapped[str | None] = mapped_column(String(255), nullable=True)  # enums.RequestStatuses

    # Related entities
    related_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # enums.RelatedNames
    related_id: Mapped[UUID | None] = mapped_column(nullable=True)

    sent_in_social: Mapped[str | None] = mapped_column(String(128), nullable=True)  # enums.SocialNames
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)

    __table_args__ = (
        Index('idx_personal_notification_user_id', 'user_id'),
        Index('idx_personal_notification_sent_in_social', 'sent_in_social'),
        Index('idx_personal_notification_sent_at', 'sent_at'),
    )
