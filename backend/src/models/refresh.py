from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Refresh(Base):
    __tablename__ = 'refresh'

    token: Mapped[str] = mapped_column(String(1024))
    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'))
    session_id: Mapped[UUID] = mapped_column(ForeignKey('session.id', ondelete='CASCADE'))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        Index('idx_refresh_token_token', 'token'),
        Index('idx_refresh_token_user_id', 'user_id'),
    )
