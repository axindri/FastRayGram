from datetime import datetime

from pydantic import BaseModel


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
