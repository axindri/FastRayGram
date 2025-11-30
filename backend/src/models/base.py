from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    __abstract__ = True

    id: Mapped[UUID] = mapped_column(primary_key=True)
    _inserted_dttm: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=text('current_timestamp'),
        default=func.current_timestamp(),
    )
    _updated_dttm: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=text('current_timestamp'),
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
