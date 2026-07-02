from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, require_roles
from src.core.enums import Role
from src.models.tw import FinancesResponse, InvoiceResponse, NewInvoiceRequest, PaymentResponse, PaymentReturnRequest
from src.schemas.users import User
from src.services.db import get_db
from src.services.tw import TimeWebService, get_timeweb_service

router = APIRouter(prefix="/tw", tags=["timeweb"])


@router.get("/finances", dependencies=[Depends(require_roles(Role.SUPERUSER))])
async def get_finances(timeweb_service: TimeWebService = Depends(get_timeweb_service)) -> FinancesResponse:
    finances = await timeweb_service.get_finances()
    return finances


@router.post("/new-invoice", dependencies=[Depends(require_roles(Role.ADMIN, Role.USER))])
async def new_invoice(
    request: NewInvoiceRequest,
    db: AsyncSession = Depends(get_db),
    timeweb_service: TimeWebService = Depends(get_timeweb_service),
    user: User = Depends(get_current_user),
) -> InvoiceResponse:
    return await timeweb_service.new_invoice(
        db,
        user.id,
        request.amount,
        request.return_url,
        request.fail_url,
    )


@router.post("/payment-return", dependencies=[Depends(require_roles(Role.ADMIN, Role.USER))])
async def payment_return(
    request: PaymentReturnRequest,
    db: AsyncSession = Depends(get_db),
    timeweb_service: TimeWebService = Depends(get_timeweb_service),
    user: User = Depends(get_current_user),
) -> InvoiceResponse:
    return await timeweb_service.mark_invoice_processing(
        db,
        user.id,
        request.invoice_id,
        request.md_order,
    )


@router.get("/payments", dependencies=[Depends(require_roles(Role.SUPERUSER))])
async def get_payments(timeweb_service: TimeWebService = Depends(get_timeweb_service)) -> list[PaymentResponse]:
    return await timeweb_service.get_payments()
