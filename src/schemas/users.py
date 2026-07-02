from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.enums import Role
from src.schemas.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    role: Mapped[str] = mapped_column(String, default=Role.USER)
    token_position: Mapped[int] = mapped_column(Integer, default=0)
    sub_url: Mapped[str] = mapped_column(String, default="")
    mark: Mapped[str] = mapped_column(String, default="")
