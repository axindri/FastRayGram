from uuid import UUID

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.enums import UserStatuses
from src.models.base import Base


class User(Base):
    __tablename__ = 'user'
    login: Mapped[str] = mapped_column(String(255), unique=True)
    password: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[UUID] = mapped_column(ForeignKey('role.id', ondelete='CASCADE'), nullable=True)
    status: Mapped[str] = mapped_column(String(255), default=UserStatuses.NOT_VERIFIED.value, nullable=False)

    __table_args__ = (Index('idx_user_login', 'login'),)
