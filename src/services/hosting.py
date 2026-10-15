from dataclasses import dataclass

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import InvoiceStatus, ServiceStatus
from src.core.logger import logger
from src.core.settings import settings
from src.models.hosting import FinancesResponse, InvoiceResponse, NewInvoiceRequest, PaymentResponse
from src.schemas.invoices import Invoice
from src.services.admin import AdminService, get_admin_service


@dataclass
class HostingService:
    token: str
    base_url: str
    timeout: int
    admin_service: AdminService

    @property
    def auth_header(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def get_status(self) -> ServiceStatus:
        url = f"{self.base_url}/accounts/me"
        response = await AsyncClient(timeout=self.timeout).get(url, headers=self.auth_header)
        response.raise_for_status()
        return ServiceStatus.OK

    async def get_finances(self) -> FinancesResponse:
        url = f"{self.base_url}/accounts/me"

        response = await AsyncClient(timeout=self.timeout).get(url, headers=self.auth_header)
        response.raise_for_status()
        data = response.json()
        return FinancesResponse(
            balance=data["balance"],
            currency=data["currency"],
        )

    async def get_payments(self) -> list[PaymentResponse]:
        url = f"{self.base_url}/billing/transactions"
        params = {"sort": "id DESC", "limit": 30, "offset": 0, "filter": '[["status","performed"]]'}
        headers = {
            **self.auth_header,
            "Accept": "application/json",
        }
        response = await AsyncClient(timeout=self.timeout).get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        return [
            PaymentResponse(
                invoice_id=item["invoiceId"],
                amount=item["amount"],
                status=item["status"],
                created_at=item["createdAt"],
                updated_at=item["performedAt"],
            )
            for item in data.get("items") or []
        ]

    async def _get_pending_db_invoice(self, db: AsyncSession, user_id: int) -> Invoice | None:
        db_invoice = await db.execute(
            select(Invoice).where(
                Invoice.user_id == user_id,
                Invoice.status.in_((InvoiceStatus.PENDING, InvoiceStatus.PROCESSING)),
            )
        )
        return db_invoice.scalar_one_or_none()

    async def new_invoice(self, db: AsyncSession, user_id: int, request: NewInvoiceRequest) -> InvoiceResponse:
        if (db_invoice := await self._get_pending_db_invoice(db, user_id)) is not None:
            logger.debug(f"Found pending invoice {db_invoice.id} for user {user_id}")
            return InvoiceResponse.model_validate(db_invoice)

        url = f"{self.base_url}/billing/invoices"
        headers = {
            **self.auth_header,
            "Accept": "application/json",
        }
        response = await AsyncClient(timeout=self.timeout).post(
            url,
            headers=headers,
            json=request.model_dump(),
        )
        response.raise_for_status()
        data = response.json()

        invoice = Invoice(
            invoice_id=int(data["id"]),
            user_id=user_id,
            payment_uuid=data["externalId"],
            confirmation_url=data["payload"]["url"],
            amount=int(data["amount"]),
            status=InvoiceStatus.PENDING,
        )

        db.add(invoice)
        await db.commit()

        return InvoiceResponse.model_validate(invoice)

    async def check_invoices(self, db: AsyncSession) -> list[InvoiceResponse]:
        await self.admin_service.cancel_old_invoices(db)
        payments = await self.get_payments()
        logger.debug(f"Found {len(payments)} payments to check")

        payed_invoices = []
        for payment in payments:
            invoice = await db.execute(
                select(Invoice).where(
                    Invoice.invoice_id == payment.invoice_id,
                    Invoice.status.in_((InvoiceStatus.PENDING, InvoiceStatus.PROCESSING)),
                )
            )
            invoice = invoice.scalar_one_or_none()
            if invoice is not None:
                invoice.status = InvoiceStatus.PAID
                logger.debug(f"Set invoice {invoice.invoice_id} status to PAID")
                await db.commit()
                payed_invoices.append(invoice)

        return [InvoiceResponse.model_validate(invoice) for invoice in payed_invoices]


async def get_hosting_service() -> HostingService:
    return HostingService(
        token=settings.hosting.token,
        base_url=settings.hosting.base_url,
        timeout=settings.app.request_timeout,
        admin_service=await get_admin_service(),
    )
