from typing import Any

from sqlalchemy import Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class News(Base):
    __tablename__ = 'news'

    title: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    __table_args__ = (Index('idx_news_title', 'title'),)
