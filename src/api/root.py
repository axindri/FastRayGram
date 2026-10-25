from fastapi import APIRouter, Depends

from src.core.cache import app_cache
from src.core.deps import require_roles
from src.core.enums import Role, ServiceStatus
from src.core.logger import get_logger
from src.core.settings import settings
from src.services.hosting import HostingService, get_hosting_service
from src.services.xui import XuiService, get_xui_service

router = APIRouter(
    tags=["root"],
    dependencies=[Depends(require_roles(Role.USER, Role.ADMIN, Role.SUPERUSER))],
)

logger = get_logger()


@router.get("/status")
@app_cache()
async def read_v2_status(
    xui_service: XuiService = Depends(get_xui_service),
    hosting_service: HostingService = Depends(get_hosting_service),
) -> dict:
    try:
        xui_version = await xui_service.get_version()
        xui_status = ServiceStatus.OK
    except Exception as e:
        logger.error(f"Error getting XUI version: {e}")
        xui_version = "0.0.0"
        xui_status = ServiceStatus.ERROR

    try:
        hosting_status = await hosting_service.get_status()
    except Exception as e:
        logger.error(f"Error getting Hosting status: {e}")
        hosting_status = ServiceStatus.ERROR

    return {
        "API": {
            "version": settings.app.version,
            "status": ServiceStatus.OK,
        },
        "XUI-Panel": {
            "version": xui_version,
            "status": xui_status,
        },
        "Hosting API": {
            "status": hosting_status,
        },
        "avilable_statuses": list(ServiceStatus),
    }


@router.get("/config")
async def app_config() -> dict[str, str | int]:
    return {
        "version": settings.app.version,
        "invoice_day_price": settings.payment.invoice_day_price,
        "min_payment_days": settings.payment.min_payment_days,
        "max_payment_days": settings.payment.max_payment_days,
        "min_invoice_amount": settings.payment.min_invoice_amount,
        "max_invoice_amount": settings.payment.max_invoice_amount,
        "default_expiry_time_days": settings.app.default_expiry_time_days,
        "registration_expiry_time_days": settings.app.registration_expiry_time_days,
        "default_limit_ips": settings.app.default_limit_ips,
        "currency": settings.payment.currency,
        "decimal_places": settings.app.decimal_places,
        "boosty_url": settings.app.boosty_url,
        "github_url": settings.app.github_url,
        "help_url": settings.app.help_url,
    }
