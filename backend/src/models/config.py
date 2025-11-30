from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.core.enums import ConfigStatuses
from src.models.base import Base


class Config(Base):
    __tablename__ = 'config'

    type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(100), nullable=False, default=ConfigStatuses.NOT_UPDATED.value)
    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    client_id: Mapped[str] = mapped_column(String(255), nullable=True)
    client_email: Mapped[str] = mapped_column(String(255), nullable=False)
    used_gb: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    limit_ip: Mapped[int] = mapped_column(Integer, nullable=False)
    subscription_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    connection_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    valid_from_dttm: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.now)
    valid_to_dttm: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.now)

    __table_args__ = (UniqueConstraint('user_id', 'type', name='uq_config_user_id_type'),)
