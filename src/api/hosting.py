from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db, require_roles
from src.core.enums import Role
from src.models.hosting import FinancesResponse, InvoiceResponse, NewInvoiceRequest, PaymentResponse
from src.schemas.users import User
from src.services.hosting import HostingService, get_hosting_service

router = APIRouter(prefix="/hosting", tags=["hosting"])


@router.get("/finances", dependencies=[Depends(require_roles(Role.SUPERUSER, Role.ADMIN))])
async def get_finances(hosting_service: HostingService = Depends(get_hosting_service)) -> FinancesResponse:
    return await hosting_service.get_finances()


@router.get("/payments", dependencies=[Depends(require_roles(Role.SUPERUSER, Role.ADMIN))])
async def get_payments(hosting_service: HostingService = Depends(get_hosting_service)) -> list[PaymentResponse]:
    return await hosting_service.get_payments()


@router.post("/new-invoice", dependencies=[Depends(require_roles(Role.ADMIN, Role.USER))])
async def new_invoice(
    request: NewInvoiceRequest,
    db: AsyncSession = Depends(get_db),
    hosting_service: HostingService = Depends(get_hosting_service),
    user: User = Depends(get_current_user),
) -> InvoiceResponse:
    return await hosting_service.new_invoice(db, user.id, request)
