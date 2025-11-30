from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Session(Base):
    __tablename__ = 'session'

    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    session_token: Mapped[str] = mapped_column(String(1024), unique=True, nullable=False)
    user_agent: Mapped[str] = mapped_column(String(1000), nullable=True)
    ip_address: Mapped[str] = mapped_column(String(255), nullable=True)
    device_info: Mapped[str] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    last_activity: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    session_name: Mapped[str] = mapped_column(String(255), nullable=True)

    __table_args__ = (Index('idx_session_user_id_is_active', 'user_id', 'is_active'),)
