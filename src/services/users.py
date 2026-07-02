from dataclasses import dataclass
from datetime import datetime, timedelta
from math import ceil

from fastapi import Depends, HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import InvoiceStatus, Role
from src.core.logger import get_logger
from src.core.settings import settings
from src.models.tw import InvoiceResponse
from src.models.users import AdminUserResponse, CreateUserRequest, UpdateUserRoleResponse, UserProfileResponse
from src.models.xui import ClientResponse, CreateClientRequest
from src.schemas.invoices import Invoice
from src.schemas.users import User
from src.services.jwt import JwtService, get_jwt_service
from src.services.xui import XuiService, get_xui_service

logger = get_logger()


@dataclass
class UserService:
    jwt_service: JwtService
    xui_service: XuiService

    async def create(self, db: AsyncSession, user: CreateUserRequest) -> str:
        token_position = 0
        await self.xui_service.add_client_to_inbounds(
            CreateClientRequest(
                email=user.username,
                comment=user.mark,
                flow=user.flow,
                total_gb=user.total_gb,
                expiry_time_days=user.expiry_time_days,
                limit_ips=user.limit_ips,
                enable=user.enable,
            )
        )
        xui_client = await self.xui_service.get_client_by_email(user.username)
        if xui_client is None:
            raise HTTPException(status_code=400, detail="Failed to create XUI client")

        db_user = User(
            username=user.username,
            role=user.role,
            mark=user.mark,
            sub_url=xui_client.sub_url,
            token_position=token_position,
        )
        db.add(db_user)
        await db.flush()
        await db.commit()
        jwt_data = {
            "sub": str(db_user.id),
            "role": str(db_user.role),
            "exp": (datetime.now() + timedelta(days=settings.app.jwt_exp_days)).timestamp(),
            "token_position": token_position,
        }
        logger.debug(f"Create user with: {jwt_data}")
        jwt_token = await self.jwt_service.encode(jwt_data)
        return jwt_token

    async def get_by_id(self, db: AsyncSession, id: int) -> User | None:
        result = await db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_by_username(self, db: AsyncSession, username: str) -> User | None:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def list_users(
        self, db: AsyncSession, page: int = 1, limit: int = 20
    ) -> tuple[list[AdminUserResponse], int, int]:
        total_result = await db.execute(select(func.count()).select_from(User))
        total = total_result.scalar_one()
        pages = max(1, ceil(total / limit)) if total else 1
        page = min(max(page, 1), pages)
        offset = (page - 1) * limit
        result = await db.execute(select(User).order_by(User.id.asc()).offset(offset).limit(limit))
        items = [AdminUserResponse.model_validate(user) for user in result.scalars().all()]
        return items, total, page

    async def get_user_profile_by_id(self, db: AsyncSession, id: int) -> UserProfileResponse:
        user = await self.get_by_id(db, id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        invoices = await db.execute(
            select(Invoice)
            .where(Invoice.user_id == id)
            .order_by(
                case((Invoice.status.in_((InvoiceStatus.PENDING, InvoiceStatus.PROCESSING)), 0), else_=1),
                Invoice.created_at.desc(),
            )
            .limit(3)
        )
        invoices = invoices.scalars().all()
        return UserProfileResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            sub_url=user.sub_url,
            invoices=[InvoiceResponse.model_validate(invoice) for invoice in invoices],
        )

    async def delete(self, db: AsyncSession, id: int) -> int:
        user = await self.get_by_id(db, id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        xui_client = await self.xui_service.get_client_by_email(user.username)
        if xui_client is not None:
            await self.xui_service.delete_client_by_email(user.username)

        await db.delete(user)
        await db.commit()
        return id

    async def refresh_token(self, db: AsyncSession, id: int) -> str:
        user = await self.get_by_id(db, id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        token_position = user.token_position + 1
        user.token_position = token_position
        await db.flush()
        await db.commit()
        jwt_data = {
            "sub": str(user.id),
            "role": str(user.role),
            "exp": (datetime.now() + timedelta(days=settings.app.jwt_exp_days)).timestamp(),
            "token_position": token_position,
        }
        logger.debug(f"Refresh token for user {user.id} with: {jwt_data}")
        jwt_token = await self.jwt_service.encode(jwt_data)
        return jwt_token

    async def _encode_user_token(self, user: User) -> str:
        jwt_data = {
            "sub": str(user.id),
            "role": str(user.role),
            "exp": (datetime.now() + timedelta(days=settings.app.jwt_exp_days)).timestamp(),
            "token_position": user.token_position,
        }
        logger.debug(f"Issue token for user {user.id} with: {jwt_data}")
        return await self.jwt_service.encode(jwt_data)

    async def update_role(self, db: AsyncSession, id: int, role: Role, actor_role: Role) -> UpdateUserRoleResponse:
        if role == Role.SUPERUSER:
            raise HTTPException(status_code=400, detail="Superuser role cannot be assigned")

        user = await self.get_by_id(db, id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role == Role.SUPERUSER:
            raise HTTPException(status_code=400, detail="Superuser role cannot be changed")
        if actor_role == Role.ADMIN and role == Role.ADMIN:
            raise HTTPException(status_code=400, detail="Admin cannot assign admin role")
        if actor_role == Role.ADMIN and user.role == Role.ADMIN:
            raise HTTPException(status_code=400, detail="Admin cannot change another admin")

        user.role = role
        user.token_position += 1
        await db.flush()
        await db.commit()
        token = await self._encode_user_token(user)
        return UpdateUserRoleResponse(user=AdminUserResponse.model_validate(user), token=token)

    async def get_xui_user_profile_by_id(self, db: AsyncSession, id: int) -> ClientResponse:
        user = await self.get_by_id(db, id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        xui_client = await self.xui_service.get_client_by_email(user.username)
        if xui_client is None:
            raise HTTPException(status_code=400, detail="User not found in XUI")
        return ClientResponse.model_validate(xui_client)


def get_user_service(
    jwt_service: JwtService = Depends(get_jwt_service), xui_service: XuiService = Depends(get_xui_service)
) -> UserService:
    return UserService(jwt_service=jwt_service, xui_service=xui_service)
