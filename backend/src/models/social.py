from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Social(Base):
    __tablename__ = 'social'
    login: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'))

    __table_args__ = (
        Index('idx_social_login', 'login'),
        Index('idx_social_user_id', 'user_id'),
        UniqueConstraint('name', 'user_id'),
    )
