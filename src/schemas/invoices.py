from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.enums import InvoiceStatus
from src.schemas.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(Integer, unique=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    payment_uuid: Mapped[str] = mapped_column(String, unique=True)
    confirmation_url: Mapped[str] = mapped_column(String)
    amount: Mapped[int]
    status: Mapped[str] = mapped_column(String, default=InvoiceStatus.PENDING)
