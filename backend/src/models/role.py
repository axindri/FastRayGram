from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Role(Base):
    __tablename__ = 'role'
    name: Mapped[str] = mapped_column(String(255), unique=True)
    weight: Mapped[int] = mapped_column(Integer)
