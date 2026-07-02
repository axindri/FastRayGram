from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.registration import RegisterRequest, RegisterValidationResponse
from src.services.db import get_db
from src.services.registration import RegistrationService, get_registration_service

router = APIRouter(prefix="/register", tags=["register"])


@router.get("/validate")
async def validate_registration_code(
    code: str = Query(min_length=1),
    db: AsyncSession = Depends(get_db),
    registration_service: RegistrationService = Depends(get_registration_service),
) -> RegisterValidationResponse:
    return await registration_service.validate_code(db, code)


@router.post("")
async def register_user(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    registration_service: RegistrationService = Depends(get_registration_service),
) -> str:
    return await registration_service.register(db, payload)
