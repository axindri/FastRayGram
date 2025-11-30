from logging import getLogger
from typing import Any, Callable
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.enums import UserRoles, UserStatuses
from src.core.exceptions import NotAuthorizedError, UserNotVerifiedError
from src.models import User
from src.schemas import UserInToken
from src.services.db import DbService, get_db_service
from src.services.jwt import JwtService, get_jwt_service
from src.utils.permission import check_required_role

logger = getLogger(__name__)

security = HTTPBearer(auto_error=False)


def get_current_token(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    token = credentials.credentials if credentials else None
    if not token:
        raise NotAuthorizedError('No token found in Authorization header')
    return token


async def get_current_user(
    token: str = Depends(get_current_token),
    jwt_manager: JwtService = Depends(get_jwt_service),
) -> UserInToken:
    return await jwt_manager.validate_access_token(token)


async def get_current_user_id(user: UserInToken = Depends(get_current_user)) -> UUID:
    return user.id


async def get_current_role(user: UserInToken = Depends(get_current_user)) -> str:
    return user.role


def required_role(role: UserRoles) -> Callable[..., Any]:
    async def dep(user: UserInToken = Depends(get_current_user)) -> None:
        logger.debug("Checking required role: '%s' for current user: %s", role, user)
        check_required_role(UserRoles(user.role), role)

    return dep


async def required_verified_user(
    user_id: UUID = Depends(get_current_user_id), db: DbService = Depends(get_db_service)
) -> None:
    async with db.transaction() as tx:
        user = await tx.db.get_or_raise(User, filter={'id': user_id})
        if user.status != UserStatuses.VERIFIED:
            raise UserNotVerifiedError('User is not verified', same_http_detail_msg=True)
