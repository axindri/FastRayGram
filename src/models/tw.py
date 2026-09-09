from datetime import datetime

from pydantic import BaseModel, Field, field_validator

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
    amount: int = Field(default=settings.app.min_invoice_amount)
    return_url: str
    fail_url: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: int) -> int:
        price = settings.app.invoice_day_price_rub
        min_days = settings.app.min_payment_days
        max_days = settings.app.max_payment_days
        min_amount = settings.app.min_invoice_amount
        max_amount = settings.app.max_invoice_amount
        if value < min_amount or value > max_amount:
            raise ValueError(f"Amount must be between {min_amount} and {max_amount}")
        if value % price != 0:
            raise ValueError(f"Amount must be a multiple of {price}")
        days = value // price
        if days < min_days or days > max_days:
            raise ValueError(f"Payment must cover from {min_days} to {max_days} days")
        return value


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
