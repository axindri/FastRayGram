from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.schemas.base import Base


class RegistrationCode(Base):
    __tablename__ = "registration_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
