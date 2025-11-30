from typing import Any
from uuid import UUID

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Request(Base):
    __tablename__ = 'request'
    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    related_id: Mapped[UUID] = mapped_column(nullable=False)
    related_name: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, default={})

    __table_args__ = (UniqueConstraint('user_id', 'name', 'related_id', name='uq_request_user_id_name_related_id'),)
