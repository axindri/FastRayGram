from src.core.settings import settings


def invoice_renewal_days(amount: int) -> int:
    """Convert paid invoice amount to subscription days (same formula as frontend)."""
    price = settings.app.invoice_day_price_rub
    if price <= 0:
        raise ValueError("Invoice day price must be positive")
    if amount % price != 0:
        raise ValueError(f"Amount must be a multiple of {price}")
    days = amount // price
    if days < 1:
        raise ValueError("Amount is too small for renewal")
    return days
