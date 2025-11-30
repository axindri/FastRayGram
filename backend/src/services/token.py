from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from logging import getLogger
from uuid import UUID

from fastapi import Depends

from src.core.enums import TokenTypes
from src.core.exceptions import NotAuthorizedError
from src.core.settings import settings
from src.core.standarts import get_timestamp_int
from src.models import Refresh as RefreshTokenModel
from src.models import Role as RoleModel
from src.models import Session as SessionModel
from src.models import User as UserModel
from src.schemas import (
    JwtDataInToken,
    JwtRefreshTokenCreate,
    JwtTokenPair,
    LoginForm,
    RequestMeta,
    SessionCreate,
    SessionDataInToken,
    SessionUpdate,
    UserDataInToken,
)
from src.services.db import DbService, get_db_service
from src.services.jwt import JwtService, get_jwt_service
from src.services.password import PasswordService, get_password_service

logger = getLogger(__name__)


@dataclass
class TokenService:
    db: DbService
    jwt_manager: JwtService
    pass_manager: PasswordService

    async def _make_access_token(self, user: UserModel, role_name: str) -> str:
        return await self.jwt_manager.make_token(
            JwtDataInToken(
                type=TokenTypes.ACCESS,
                sub=str(user.id),
                data=UserDataInToken(
                    role=role_name,
                ).model_dump(),
                exp=get_timestamp_int(
                    datetime.now(timezone.utc).replace(tzinfo=None)
                    + timedelta(seconds=settings.auth.access_token_expire_sec)
                ),
            ).model_dump(),
            settings.auth.access_token_expire_sec,
        )

    async def _make_refresh_token(self, user: UserModel, session_id: UUID) -> str:
        return await self.jwt_manager.make_token(
            JwtDataInToken(
                type=TokenTypes.REFRESH,
                sub=str(user.id),
                data=SessionDataInToken(
                    session_id=str(session_id),
                ).model_dump(),
                exp=get_timestamp_int(
                    datetime.now(timezone.utc).replace(tzinfo=None)
                    + timedelta(seconds=settings.auth.refresh_token_expire_sec)
                ),
            ).model_dump(),
            settings.auth.refresh_token_expire_sec,
        )

    def _verify_password_or_raise(self, login_form: LoginForm, user: UserModel) -> None:
        if not self.pass_manager.verify(login_form.password, user.password):
            logger.debug('Bad user %s password', user.login)
            raise NotAuthorizedError(f'Bad user {user.login} password', 'Bad login or password')

    async def create_token_pair(
        self,
        login_form: LoginForm,
        meta: RequestMeta,
    ) -> JwtTokenPair:
        process_time = datetime.now(timezone.utc).replace(tzinfo=None)
        access_ttl = timedelta(seconds=settings.auth.access_token_expire_sec)
        refresh_ttl = timedelta(seconds=settings.auth.refresh_token_expire_sec)
        access_expires_at = process_time + access_ttl
        refresh_expires_at = process_time + refresh_ttl

        async with self.db.transaction() as tx:
            logger.debug('Try to auth user with login: %s', login_form.login)

            user = await tx.db.get(UserModel, filter={'login': login_form.login})
            if not user:
                logger.debug('No user with login %s was found', login_form.login)
                raise NotAuthorizedError(f'No user with login {login_form.login}', 'Bad login or password')

            user_role = await tx.db.get_or_raise(RoleModel, filter={'id': user.role_id})
            self._verify_password_or_raise(login_form, user)

            access_token = await self._make_access_token(user, user_role.name)
            session_in_db = await tx.db.create(
                SessionModel,
                SessionCreate(
                    **meta.model_dump(),
                    user_id=user.id,
                    session_token=access_token,
                    expires_at=access_expires_at,
                    last_activity=process_time,
                ).model_dump(),
            )

            refresh_token = await self._make_refresh_token(user, session_in_db.id)
            await tx.db.create(
                RefreshTokenModel,
                JwtRefreshTokenCreate(
                    token=refresh_token,
                    user_id=user.id,
                    session_id=session_in_db.id,
                    expires_at=refresh_expires_at,
                    is_active=True,
                ).model_dump(),
            )

            await self.jwt_manager.create_access_token(access_token, str(user.id))
            await self.jwt_manager.create_refresh_token(refresh_token, str(user.id))

            logger.debug('Successfully login with user: %s', user.login)
            return JwtTokenPair(access=access_token, refresh=refresh_token)

    async def create_token_pair_social(
        self,
        user: UserModel,
        meta: RequestMeta,
    ) -> JwtTokenPair:
        process_time = datetime.now(timezone.utc).replace(tzinfo=None)
        access_ttl = timedelta(seconds=settings.auth.access_token_expire_sec)
        refresh_ttl = timedelta(seconds=settings.auth.refresh_token_expire_sec)
        access_expires_at = process_time + access_ttl
        refresh_expires_at = process_time + refresh_ttl
        async with self.db.transaction() as tx:
            user_role = await tx.db.get_or_raise(RoleModel, filter={'id': user.role_id})
            access_token = await self._make_access_token(user, user_role.name)
            session_in_db = await tx.db.create(
                SessionModel,
                SessionCreate(
                    **meta.model_dump(),
                    user_id=user.id,
                    session_token=access_token,
                    expires_at=access_expires_at,
                    last_activity=process_time,
                ).model_dump(),
            )

            refresh_token = await self._make_refresh_token(user, session_in_db.id)
            await tx.db.create(
                RefreshTokenModel,
                JwtRefreshTokenCreate(
                    token=refresh_token,
                    user_id=user.id,
                    session_id=session_in_db.id,
                    expires_at=refresh_expires_at,
                    is_active=True,
                ).model_dump(),
            )

            await self.jwt_manager.create_access_token(access_token, str(user.id))
            await self.jwt_manager.create_refresh_token(refresh_token, str(user.id))

            logger.debug('Successfully login with user: %s', user.login)
            return JwtTokenPair(access=access_token, refresh=refresh_token)

    async def refresh_token_pair(self, refresh_token: str, meta: RequestMeta) -> JwtTokenPair:
        process_time = datetime.now(timezone.utc).replace(tzinfo=None)
        access_ttl = timedelta(seconds=settings.auth.access_token_expire_sec)
        refresh_ttl = timedelta(seconds=settings.auth.refresh_token_expire_sec)
        access_expires_at = process_time + access_ttl
        refresh_expires_at = process_time + refresh_ttl
        session_in_token = await self.jwt_manager.validate_refresh_token(refresh_token)
        session_id = UUID(session_in_token.session_id)

        async with self.db.transaction() as tx:
            refresh_token_in_db = await tx.db.get_or_raise(RefreshTokenModel, filter={'token': refresh_token})
            if not refresh_token_in_db.is_active or refresh_token_in_db.expires_at <= process_time:
                raise NotAuthorizedError('Refresh token is not active, already used', 'Invalid refresh token')

            session = await tx.db.get_or_raise(SessionModel, filter={'id': session_id})
            if not session.is_active:
                raise NotAuthorizedError('Session is not active', 'Invalid session')

            user = await tx.db.get_or_raise(UserModel, filter={'id': session.user_id})
            user_role = await tx.db.get_or_raise(RoleModel, filter={'id': user.role_id})

            await tx.db.update(RefreshTokenModel, refresh_token_in_db.id, {'is_active': False})
            await self.jwt_manager.revoke_refresh_token(str(user.id), refresh_token)

            new_access_token = await self._make_access_token(user, user_role.name)
            new_refresh_token = await self._make_refresh_token(user, session_id)

            await self.jwt_manager.revoke_access_token(str(user.id), session.session_token)
            await tx.db.create(
                RefreshTokenModel,
                JwtRefreshTokenCreate(
                    token=new_refresh_token,
                    user_id=user.id,
                    session_id=session_id,
                    expires_at=refresh_expires_at,
                    is_active=True,
                ).model_dump(),
            )
            await tx.db.update(
                SessionModel,
                session_id,
                SessionUpdate(
                    **meta.model_dump(),
                    session_token=new_access_token,
                    expires_at=access_expires_at,
                    last_activity=process_time,
                ).model_dump(exclude_unset=True),
            )
            await self.jwt_manager.create_access_token(new_access_token, str(user.id))
            await self.jwt_manager.create_refresh_token(new_refresh_token, str(user.id))
        return JwtTokenPair(access=new_access_token, refresh=new_refresh_token)

    async def revoke_access_token(self, token: str) -> bool:
        logger.debug('Try to logout with token: %s', token)
        async with self.db.transaction() as tx:
            session = await tx.db.get(SessionModel, filter={'session_token': token})
            if not session:
                raise NotAuthorizedError('Session not found', 'Invalid session')

            await self.jwt_manager.revoke_access_token(str(session.user_id), token)
        logger.debug('Successfully logout with token: %s', token)
        return True


async def get_token_service(
    db: DbService = Depends(get_db_service),
    jwt_manager: JwtService = Depends(get_jwt_service),
    pass_manager: PasswordService = Depends(get_password_service),
) -> TokenService:
    return TokenService(db, jwt_manager, pass_manager)
