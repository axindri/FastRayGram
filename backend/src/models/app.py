from typing import Any

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class AppSettings(Base):
    __tablename__ = 'settings'
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    values: Mapped[dict[str, Any]] = mapped_column(JSONB, default={})

    __table_args__ = (UniqueConstraint('name', name='uq_settings_name'),)
