from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, require_roles
from src.core.enums import Role
from src.core.settings import settings
from src.models.common import PaginatedResponse, build_paginated_response
from src.models.fields import USERNAME_MAX_LENGTH
from src.models.registration import (
    CreateRegistrationCodeRequest,
    ExtendRegistrationCodeRequest,
    RegistrationCodeResponse,
)
from src.models.tw import AdminInvoiceResponse, InvoiceResponse
from src.models.users import AdminUserResponse, CreateUserRequest, UpdateUserRoleRequest, UpdateUserRoleResponse, UserStatsResponse
from src.models.xui import UpdateClientRequest
from src.schemas.users import User
from src.services.db import get_db
from src.services.registration import RegistrationService, get_registration_service
from src.services.tw import TimeWebService, get_timeweb_service
from src.services.users import UserService, get_user_service
from src.services.xui import XuiService, get_xui_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(Role.SUPERUSER, Role.ADMIN))])


@router.get("/links")
async def admin_links() -> dict[str, str]:
    return {
        "swagger_url": "/docs",
        "xui_panel_url": settings.xui.url,
        "servers_url": settings.timeweb.servers_url,
        "services_status_url": settings.app.monitoring_service_url,
    }


@router.get("/users/stats")
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> UserStatsResponse:
    return await user_service.get_user_stats(db)


@router.get("/users")
async def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=USERNAME_MAX_LENGTH),
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> PaginatedResponse[AdminUserResponse]:
    items, total, page = await user_service.list_users(db, page=page, limit=limit, search=search)
    return build_paginated_response(items, total, page, limit)


@router.post("/users/create")
async def create_user(
    new_user: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
) -> str:
    if new_user.role == Role.SUPERUSER:
        raise HTTPException(status_code=400, detail="Superuser cannot be created")
    if current_user.role == Role.ADMIN and new_user.role == Role.ADMIN:
        raise HTTPException(status_code=400, detail="Admin cannot create another admin")
    return await user_service.create(db, new_user)


@router.post("/users/{id}/refresh-token")
async def refresh_token(
    id: int,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> str:
    return await user_service.refresh_token(db, id)


@router.post("/users/{id}/role")
async def update_user_role(
    id: int,
    payload: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
) -> UpdateUserRoleResponse:
    return await user_service.update_role(db, id, payload.role, current_user.role)


@router.get("/users/get/{id}")
async def get_user(
    id: int,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> AdminUserResponse:
    return await user_service.get_admin_user(db, id)


@router.delete("/users/delete/{id}")
async def delete_user(
    id: int,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> None:
    return await user_service.delete(db, id)


@router.get("/invoices")
async def list_invoices(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: int | None = Query(default=None, ge=1),
    invoice_id: int | None = Query(default=None, ge=1),
    id: int | None = Query(default=None, ge=1),
    username: str | None = Query(default=None, max_length=USERNAME_MAX_LENGTH),
    db: AsyncSession = Depends(get_db),
    tw_service: TimeWebService = Depends(get_timeweb_service),
) -> PaginatedResponse[AdminInvoiceResponse]:
    items, total, page = await tw_service.list_invoices(
        db,
        page=page,
        limit=limit,
        user_id=user_id,
        invoice_id=invoice_id,
        invoice_db_id=id,
        username=username,
    )
    return build_paginated_response(items, total, page, limit)


@router.get("/invoices/check")
async def check_invoices(
    db: AsyncSession = Depends(get_db),
    tw_service: TimeWebService = Depends(get_timeweb_service),
    xui_service: XuiService = Depends(get_xui_service),
    user_service: UserService = Depends(get_user_service),
) -> list[InvoiceResponse]:
    payed_invoices = await tw_service.check_invoices(db)
    for invoice in payed_invoices:
        user = await user_service.get_by_id(db, invoice.user_id)
        if user is None:
            continue
        await xui_service.update_client_by_email(
            user.username,
            UpdateClientRequest(expiry_time_days=settings.app.default_expiry_time_days, enable=True),
        )
        await xui_service.reset_client_traffic_by_email(user.username)
    return payed_invoices


@router.post("/invoices/{id}/cancel")
async def cancel_invoice(
    id: int,
    db: AsyncSession = Depends(get_db),
    tw_service: TimeWebService = Depends(get_timeweb_service),
) -> InvoiceResponse:
    return await tw_service.cancel_invoice(db, id)


@router.get("/registration-codes")
async def list_registration_codes(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    registration_service: RegistrationService = Depends(get_registration_service),
) -> PaginatedResponse[RegistrationCodeResponse]:
    items, total, page = await registration_service.list_codes(db, page=page, limit=limit)
    return build_paginated_response(items, total, page, limit)


@router.post("/registration-codes")
async def create_registration_code(
    payload: CreateRegistrationCodeRequest,
    db: AsyncSession = Depends(get_db),
    registration_service: RegistrationService = Depends(get_registration_service),
    current_user: User = Depends(get_current_user),
) -> RegistrationCodeResponse:
    return await registration_service.create_code(db, current_user, payload)


@router.post("/registration-codes/{id}/disable")
async def disable_registration_code(
    id: int,
    db: AsyncSession = Depends(get_db),
    registration_service: RegistrationService = Depends(get_registration_service),
) -> RegistrationCodeResponse:
    return await registration_service.disable_code(db, id)


@router.post("/registration-codes/{id}/extend")
async def extend_registration_code(
    id: int,
    payload: ExtendRegistrationCodeRequest,
    db: AsyncSession = Depends(get_db),
    registration_service: RegistrationService = Depends(get_registration_service),
) -> RegistrationCodeResponse:
    return await registration_service.extend_code(db, id, payload)
