from dataclasses import dataclass
from datetime import datetime, timedelta
from math import ceil

from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import InvoiceStatus, ServiceStatus
from src.core.logger import logger
from src.core.settings import settings
from src.models.tw import AdminInvoiceResponse, FinancesResponse, InvoiceResponse, PaymentResponse
from src.schemas.invoices import Invoice
from src.schemas.users import User


@dataclass
class TimeWebService:
    base_url: str
    token: str
    timeout: int

    async def get_status(self) -> ServiceStatus:
        url = f"{self.base_url}/account/status"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        response = await AsyncClient(timeout=self.timeout).get(url, headers=headers)
        response.raise_for_status()
        return ServiceStatus.OK

    async def get_finances(self) -> FinancesResponse:
        url = f"{self.base_url}/account/finances"
        logger.debug(f"tw token: {self.token[:10]}...")
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        response = await AsyncClient(timeout=self.timeout).get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return FinancesResponse(
            balance=data["finances"]["balance"],
            currency=data["finances"]["currency"],
            monthly_cost=data["finances"]["monthly_cost"],
            total_paid=data["finances"]["total_paid"],
            hours_left=data["finances"]["hours_left"],
        )

    async def new_invoice(
        self, db: AsyncSession, user_id: int, amount: int, return_url: str, fail_url: str
    ) -> InvoiceResponse:
        db_invoice = await db.execute(
            select(Invoice).where(
                Invoice.user_id == user_id,
                Invoice.status.in_((InvoiceStatus.PENDING, InvoiceStatus.PROCESSING)),
            )
        )
        invoice = db_invoice.scalar_one_or_none()
        if invoice is not None:
            return InvoiceResponse.model_validate(invoice)

        url = f"{settings.timeweb.portal_url}/invoices"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            **settings.timeweb.default_headers,
        }
        payload = {
            "total_amount": amount,
            "payer": {"id": settings.timeweb.payer_id},
            "payment_method": {
                "type": "card",
                "params": {
                    "bind": False,
                    "return_url": return_url,
                    "fail_url": fail_url,
                },
            },
            "items": [],
        }
        response = await AsyncClient(timeout=self.timeout).post(
            url,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

        invoice = Invoice(
            invoice_id=int(data["invoice_id"]),
            user_id=user_id,
            payment_uuid=data["payment_info"]["id"],
            confirmation_url=data["payment_info"]["confirmation"]["confirmation_url"],
            amount=amount,
            status=InvoiceStatus.PENDING,
        )
        db.add(invoice)
        await db.commit()
        return InvoiceResponse.model_validate(invoice)

    async def get_payments(self) -> list[PaymentResponse]:
        url = f"{settings.timeweb.api_url}/accounts/payments?limit=1000&offset=0&locale=ru"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            **settings.timeweb.default_headers,
        }
        response = await AsyncClient(timeout=self.timeout).get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        payments = data["payments"]
        return [PaymentResponse.model_validate(payment) for payment in payments if payment["type"] == "incom"]

    async def check_invoices(self, db: AsyncSession) -> list[InvoiceResponse]:
        payments = await self.get_payments()
        logger.debug(f"Found payments: {payments}")
        payed_invoices = []

        db_invoices = await db.execute(
            select(Invoice).where(
                Invoice.status == InvoiceStatus.PENDING, Invoice.created_at < datetime.now() - timedelta(hours=1)
            )
        )
        db_invoices = db_invoices.scalars().all()
        for invoice in db_invoices:
            invoice.status = InvoiceStatus.CANCELLED
            logger.debug(f"Set invoice {invoice.invoice_id} status to CANCELLED")
            await db.commit()

        for payment in payments:
            invoice = await db.execute(
                select(Invoice).where(
                    Invoice.invoice_id == payment.invoice,
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

    async def mark_invoice_processing(
        self, db: AsyncSession, user_id: int, invoice_id: int, md_order: str | None
    ) -> InvoiceResponse:
        result = await db.execute(
            select(Invoice).where(Invoice.user_id == user_id, Invoice.invoice_id == invoice_id)
        )
        invoice = result.scalar_one_or_none()
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")

        if invoice.status == InvoiceStatus.PROCESSING:
            return InvoiceResponse.model_validate(invoice)

        if invoice.status != InvoiceStatus.PENDING:
            raise HTTPException(status_code=400, detail="Invoice is not awaiting payment")

        if md_order and invoice.payment_uuid != md_order:
            raise HTTPException(status_code=400, detail="Payment order mismatch")

        invoice.status = InvoiceStatus.PROCESSING
        await db.commit()
        await db.refresh(invoice)
        logger.debug(f"Set invoice {invoice.invoice_id} status to PROCESSING")
        return InvoiceResponse.model_validate(invoice)

    async def cancel_invoice(self, db: AsyncSession, id: int) -> InvoiceResponse:
        result = await db.execute(select(Invoice).where(Invoice.id == id))
        invoice = result.scalar_one_or_none()
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        if invoice.status == InvoiceStatus.PAID:
            raise HTTPException(status_code=400, detail="Paid invoice cannot be cancelled")

        invoice.status = InvoiceStatus.CANCELLED
        await db.commit()
        await db.refresh(invoice)
        logger.debug(f"Set invoice {invoice.invoice_id} status to CANCELLED")
        return InvoiceResponse.model_validate(invoice)

    async def list_invoices(
        self,
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        user_id: int | None = None,
        invoice_id: int | None = None,
        invoice_db_id: int | None = None,
        username: str | None = None,
    ) -> tuple[list[AdminInvoiceResponse], int, int]:
        filters = []
        if user_id is not None:
            filters.append(Invoice.user_id == user_id)
        if invoice_id is not None:
            filters.append(Invoice.invoice_id == invoice_id)
        if invoice_db_id is not None:
            filters.append(Invoice.id == invoice_db_id)
        if username is not None:
            filters.append(User.username.ilike(f"%{username.strip()}%"))

        needs_user_join = username is not None
        total_query = select(func.count()).select_from(Invoice)
        if needs_user_join:
            total_query = total_query.join(User, Invoice.user_id == User.id)
        if filters:
            total_query = total_query.where(*filters)
        total_result = await db.execute(total_query)
        total = total_result.scalar_one()
        pages = max(1, ceil(total / limit)) if total else 1
        page = min(max(page, 1), pages)
        offset = (page - 1) * limit
        invoices_query = (
            select(Invoice, User.username, User.mark, User.sub_url)
            .outerjoin(User, Invoice.user_id == User.id)
            .order_by(
                case((Invoice.status.in_((InvoiceStatus.PENDING, InvoiceStatus.PROCESSING)), 0), else_=1),
                Invoice.created_at.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        if filters:
            invoices_query = invoices_query.where(*filters)
        result = await db.execute(invoices_query)

        items = [
            AdminInvoiceResponse(
                id=invoice.id,
                invoice_id=invoice.invoice_id,
                user_id=invoice.user_id,
                username=username or "",
                mark=mark or "",
                sub_url=sub_url or "",
                payment_uuid=invoice.payment_uuid,
                confirmation_url=invoice.confirmation_url,
                amount=invoice.amount,
                status=invoice.status,
                created_at=invoice.created_at,
                updated_at=invoice.updated_at,
            )
            for invoice, username, mark, sub_url in result.all()
        ]
        return items, total, page


async def get_timeweb_service() -> TimeWebService:
    return TimeWebService(
        base_url=settings.timeweb.base_url,
        token=settings.timeweb.token,
        timeout=settings.app.request_timeout,
    )
