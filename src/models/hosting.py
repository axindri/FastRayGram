from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.core.enums import PaymentMethod
from src.core.settings import settings


class FinancesResponse(BaseModel):
    balance: float
    currency: str
    decimal_places: int = Field(default=settings.app.decimal_places)

    model_config = ConfigDict(from_attributes=True)


class PaymentResponse(BaseModel):
    invoice_id: int
    amount: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class NewInvoiceRequest(BaseModel):
    method: PaymentMethod = Field(default=PaymentMethod.YOOKASSA_SBP)
    amount: int = Field(default=settings.payment.min_invoice_amount)


class InvoiceResponse(BaseModel):
    id: int
    invoice_id: int
    user_id: int
    payment_uuid: str
    amount: int
    confirmation_url: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
