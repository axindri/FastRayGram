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
        return registration_code.enable and registration_code.expires_at > datetime.now()

    def _has_registration_slots(self, registration_code: RegistrationCode, registrations_count: int) -> bool:
        if registration_code.max_registrations == 0:
            return True
        return registrations_count < registration_code.max_registrations

    async def _count_registrations(self, db: AsyncSession, code_id: int) -> int:
        result = await db.execute(
            select(func.count()).select_from(User).where(User.registration_code_id == code_id)
        )
        return result.scalar_one()

    async def _registration_counts_by_code_ids(
        self, db: AsyncSession, code_ids: list[int]
    ) -> dict[int, int]:
        if not code_ids:
            return {}

        result = await db.execute(
            select(User.registration_code_id, func.count())
            .where(User.registration_code_id.in_(code_ids))
            .group_by(User.registration_code_id)
        )
        return {code_id: count for code_id, count in result.all()}

    def _to_code_response(
        self, registration_code: RegistrationCode, registrations_count: int
    ) -> RegistrationCodeResponse:
        return RegistrationCodeResponse(
            id=registration_code.id,
            code=registration_code.code,
            expires_at=registration_code.expires_at,
            max_registrations=registration_code.max_registrations,
            registrations_count=registrations_count,
            enable=registration_code.enable,
            created_by_id=registration_code.created_by_id,
            created_at=registration_code.created_at,
            updated_at=registration_code.updated_at,
        )

    async def _get_code_by_value(self, db: AsyncSession, code: str) -> RegistrationCode | None:
        result = await db.execute(select(RegistrationCode).where(RegistrationCode.code == code))
        return result.scalar_one_or_none()

    async def validate_code(self, db: AsyncSession, code: str) -> RegisterValidationResponse:
        registration_code = await self._get_code_by_value(db, code)
        if registration_code is None:
            return RegisterValidationResponse(
                valid=False,
                expires_at=None,
                registration_expiry_days=settings.app.registration_expiry_time_days,
            )

        registrations_count = await self._count_registrations(db, registration_code.id)
        valid = self._is_code_valid(registration_code) and self._has_registration_slots(
            registration_code, registrations_count
        )
        return RegisterValidationResponse(
            valid=valid,
            expires_at=registration_code.expires_at,
            registration_expiry_days=settings.app.registration_expiry_time_days,
        )

    async def register(self, db: AsyncSession, payload: RegisterRequest) -> str:
        registration_code = await self._get_code_by_value(db, payload.code)
        if registration_code is None:
            raise HTTPException(status_code=400, detail="Invalid or expired registration code")
        if not registration_code.enable:
            raise HTTPException(status_code=400, detail="Registration code is disabled")
        if not self._is_code_valid(registration_code):
            raise HTTPException(status_code=400, detail="Invalid or expired registration code")

        registrations_count = await self._count_registrations(db, registration_code.id)
        if not self._has_registration_slots(registration_code, registrations_count):
            raise HTTPException(status_code=400, detail="Registration limit reached for this code")

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
            registration_code_id=registration_code.id,
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
            max_registrations=payload.max_registrations,
            created_by_id=None if admin.id == 0 else admin.id,
        )
        db.add(registration_code)
        await db.commit()
        await db.refresh(registration_code)
        return self._to_code_response(registration_code, 0)

    async def disable_code(self, db: AsyncSession, id: int) -> RegistrationCodeResponse:
        result = await db.execute(select(RegistrationCode).where(RegistrationCode.id == id))
        registration_code = result.scalar_one_or_none()
        if registration_code is None:
            raise HTTPException(status_code=404, detail="Registration code not found")
        if not registration_code.enable:
            raise HTTPException(status_code=400, detail="Registration code is already disabled")

        registration_code.enable = False
        await db.commit()
        await db.refresh(registration_code)
        registrations_count = await self._count_registrations(db, registration_code.id)
        return self._to_code_response(registration_code, registrations_count)

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
        registrations_count = await self._count_registrations(db, registration_code.id)
        return self._to_code_response(registration_code, registrations_count)

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
        codes = list(result.scalars().all())
        counts = await self._registration_counts_by_code_ids(db, [code.id for code in codes])
        items = [self._to_code_response(code, counts.get(code.id, 0)) for code in codes]
        return items, total, page


def get_registration_service(
    user_service: UserService = Depends(get_user_service),
) -> RegistrationService:
    return RegistrationService(user_service=user_service)
