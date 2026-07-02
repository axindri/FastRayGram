import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from math import ceil

from fastapi import Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import Role
from src.core.logger import get_logger
from src.core.settings import settings
from src.models.registration import (
    CreateRegistrationCodeRequest,
    ExtendRegistrationCodeRequest,
    RegisterRequest,
    RegisterValidationResponse,
    RegistrationCodeResponse,
)
from src.models.users import CreateUserRequest
from src.schemas.registration_codes import RegistrationCode
from src.schemas.users import User
from src.services.users import UserService, get_user_service

logger = get_logger()


@dataclass
class RegistrationService:
    user_service: UserService

    def _is_code_valid(self, registration_code: RegistrationCode) -> bool:
        return registration_code.expires_at > datetime.now()

    async def _get_code_by_value(self, db: AsyncSession, code: str) -> RegistrationCode | None:
        result = await db.execute(select(RegistrationCode).where(RegistrationCode.code == code))
        return result.scalar_one_or_none()

    async def validate_code(self, db: AsyncSession, code: str) -> RegisterValidationResponse:
        registration_code = await self._get_code_by_value(db, code)
        valid = registration_code is not None and self._is_code_valid(registration_code)
        return RegisterValidationResponse(
            valid=valid,
            expires_at=registration_code.expires_at if registration_code else None,
            registration_expiry_days=settings.app.registration_expiry_time_days,
        )

    async def register(self, db: AsyncSession, payload: RegisterRequest) -> str:
        registration_code = await self._get_code_by_value(db, payload.code)
        if registration_code is None or not self._is_code_valid(registration_code):
            raise HTTPException(status_code=400, detail="Invalid or expired registration code")

        username = payload.username

        existing_user = await self.user_service.get_by_username(db, username)
        if existing_user is not None:
            raise HTTPException(status_code=400, detail="Username already taken")

        token = await self.user_service.create(
            db,
            CreateUserRequest(
                username=username,
                role=Role.USER,
                mark=payload.mark,
                expiry_time_days=settings.app.registration_expiry_time_days,
                limit_ips=settings.app.default_limit_ips,
            ),
        )

        user = await self.user_service.get_by_username(db, username)
        if user is None:
            raise HTTPException(status_code=500, detail="Failed to create user")

        logger.debug(f"User {user.id} registered with code {registration_code.code}")
        return token

    async def create_code(
        self, db: AsyncSession, admin: User, payload: CreateRegistrationCodeRequest
    ) -> RegistrationCodeResponse:
        registration_code = RegistrationCode(
            code=secrets.token_urlsafe(16),
            expires_at=datetime.now() + timedelta(days=payload.valid_days),
            created_by_id=None if admin.id == 0 else admin.id,
        )
        db.add(registration_code)
        await db.commit()
        await db.refresh(registration_code)
        return RegistrationCodeResponse.model_validate(registration_code)

    async def delete_code(self, db: AsyncSession, id: int) -> None:
        result = await db.execute(select(RegistrationCode).where(RegistrationCode.id == id))
        registration_code = result.scalar_one_or_none()
        if registration_code is None:
            raise HTTPException(status_code=404, detail="Registration code not found")

        await db.delete(registration_code)
        await db.commit()

    async def extend_code(
        self, db: AsyncSession, id: int, payload: ExtendRegistrationCodeRequest
    ) -> RegistrationCodeResponse:
        result = await db.execute(select(RegistrationCode).where(RegistrationCode.id == id))
        registration_code = result.scalar_one_or_none()
        if registration_code is None:
            raise HTTPException(status_code=404, detail="Registration code not found")

        base = max(registration_code.expires_at, datetime.now())
        registration_code.expires_at = base + timedelta(days=payload.extend_days)
        await db.commit()
        await db.refresh(registration_code)
        return RegistrationCodeResponse.model_validate(registration_code)

    async def list_codes(
        self, db: AsyncSession, page: int = 1, limit: int = 20
    ) -> tuple[list[RegistrationCodeResponse], int, int]:
        total_result = await db.execute(select(func.count()).select_from(RegistrationCode))
        total = total_result.scalar_one()
        pages = max(1, ceil(total / limit)) if total else 1
        page = min(max(page, 1), pages)
        offset = (page - 1) * limit

        result = await db.execute(
            select(RegistrationCode).order_by(RegistrationCode.created_at.desc()).offset(offset).limit(limit)
        )
        items = [RegistrationCodeResponse.model_validate(item) for item in result.scalars().all()]
        return items, total, page


def get_registration_service(
    user_service: UserService = Depends(get_user_service),
) -> RegistrationService:
    return RegistrationService(user_service=user_service)
