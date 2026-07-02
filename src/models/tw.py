from datetime import datetime

from pydantic import BaseModel, Field

from src.core.settings import settings


class FinancesResponse(BaseModel):
    balance: float
    currency: str
    monthly_cost: float
    total_paid: float
    hours_left: int

    class Config:
        from_attributes = True


class NewInvoiceRequest(BaseModel):
    amount: int = Field(
        default=settings.app.min_invoice_amount,
        ge=settings.app.min_invoice_amount,
        le=settings.app.max_invoice_amount,
    )
    return_url: str
    fail_url: str


class PaymentReturnRequest(BaseModel):
    invoice_id: int
    md_order: str | None = None


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


class AdminInvoiceResponse(BaseModel):
    id: int
    invoice_id: int
    user_id: int
    username: str = ""
    mark: str = ""
    sub_url: str = ""
    payment_uuid: str
    confirmation_url: str
    amount: int
    status: str
    created_at: datetime
    updated_at: datetime


class PaymentResponse(BaseModel):
    date: datetime
    description: str
    invoice: int
    payment_type: str
    sum: float
    type: str
    vds_id: int

    class Config:
        from_attributes = True
