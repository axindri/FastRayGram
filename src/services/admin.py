from dataclasses import dataclass
from datetime import datetime, timedelta
from math import ceil

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import InvoiceStatus
from src.core.logger import logger
from src.models.admin import AdminInvoiceResponse
from src.models.hosting import InvoiceResponse
from src.schemas.invoices import Invoice
from src.schemas.users import User


@dataclass
class AdminService:
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

    async def cancel_old_invoices(self, db: AsyncSession) -> None:
        db_invoices = await db.execute(
            select(Invoice).where(
                Invoice.status == InvoiceStatus.PENDING,
                Invoice.created_at < datetime.now() - timedelta(hours=1),
            )
        )
        db_invoices = db_invoices.scalars().all()
        logger.debug(f"Found {len(db_invoices)} old invoices to cancel")
        for invoice in db_invoices:
            invoice.status = InvoiceStatus.CANCELLED
            logger.debug(f"Set invoice {invoice.invoice_id} status to CANCELLED because it's old")
            await db.commit()

    async def get_invoices(
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


async def get_admin_service() -> AdminService:
    return AdminService()
