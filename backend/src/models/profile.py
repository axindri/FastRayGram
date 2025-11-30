from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Profile(Base):
    __tablename__ = 'profile'
    user_id: Mapped[UUID] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'))
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str] = mapped_column(String(255), nullable=True)
    lang_code: Mapped[str] = mapped_column(String(4))
    email: Mapped[str] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        Index('idx_profile_first_name', 'first_name'),
        Index('idx_profile_email', 'email'),
        UniqueConstraint('user_id'),
    )
