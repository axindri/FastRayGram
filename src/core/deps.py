from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import Role
from src.core.logger import get_logger
from src.core.settings import settings
from src.schemas.users import User
from src.services.db import get_db
from src.services.jwt import JwtService, get_jwt_service
from src.services.users import UserService, get_user_service

security = HTTPBearer()

logger = get_logger()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(security)],
    jwt_service: JwtService = Depends(get_jwt_service),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        if credentials.credentials == settings.app.superuser_token:
            user = User(
                id=0,
                username=Role.SUPERUSER,
                role=Role.SUPERUSER,
                token_position=0,
                mark="",
            )
            logger.debug(f"Logged in with: {user}")
            return user
        payload = await jwt_service.decode(credentials.credentials)
        user_data = {
            "user_id": int(payload["sub"]),
            "token_position": payload["token_position"],
        }
        db_user = await user_service.get_by_id(db, user_data["user_id"])
        if db_user is None:
            logger.error(f"User not found while JWT decoding: {user_data['user_id']}")
            raise HTTPException(status_code=401, detail="Invalid token")
        if db_user.token_position != user_data["token_position"]:
            logger.error(
                f"Invalid token position for user {db_user.id}: "
                f"{db_user.token_position} != {user_data['token_position']}"
            )
            raise HTTPException(status_code=401, detail="Invalid token")

        logger.debug(f"Logged in with: {db_user}")
        return db_user
    except Exception as e:
        logger.error(f"Error getting current user from JWT: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(*roles: Role):
    async def checker(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden",
            )
        return user

    return checker
