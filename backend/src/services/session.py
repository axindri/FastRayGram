from dataclasses import dataclass
from datetime import datetime, timezone
from logging import getLogger
from uuid import UUID

from fastapi import Depends

from src.core.exceptions import NotAuthorizedError
from src.core.settings import settings
from src.models import Refresh as RefreshTokenModel
from src.models import Session as SessionModel
from src.schemas import (
    PagedResponse,
    Pagination,
    PaginationParamsInResponse,
    RequestMeta,
    SessionResponse,
    SessionUpdate,
)
from src.services.db import DbService, get_db_service
from src.services.jwt import JwtService, get_jwt_service

logger = getLogger(__name__)


@dataclass
class SessionService:
    db: DbService
    jwt_manager: JwtService

    async def update_session_activity(self, access_token: str, meta: RequestMeta) -> bool:
        async with self.db.transaction() as tx:
            session = await tx.db.get(SessionModel, filter={'session_token': access_token, 'is_active': True})
            if session:
                session_data = SessionUpdate(
                    **meta.model_dump(),
                    last_activity=datetime.now(timezone.utc).replace(tzinfo=None),
                )
                await tx.db.update(SessionModel, session.id, session_data.model_dump(exclude_unset=True))
                return True
            return False

    async def deactivate_session(self, access_token: str) -> None:
        process_time = datetime.now(timezone.utc).replace(tzinfo=None)
        async with self.db.transaction() as tx:
            if session := await tx.db.get(SessionModel, filter={'session_token': access_token}):
                await tx.db.update(
                    SessionModel,
                    session.id,
                    SessionUpdate(is_active=False, last_activity=process_time).model_dump(exclude_unset=True),
                )
                logger.debug('Successfully deactivated session: %s', session.id)

                refresh_tokens = await tx.db.get_all(
                    RefreshTokenModel,
                    filter={'session_id': session.id, 'is_active': True},
                )
                if refresh_tokens:
                    await tx.db.update_all(RefreshTokenModel, {'is_active': False}, filter={'session_id': session.id})
                    for refresh_token in refresh_tokens:
                        await self.jwt_manager.revoke_refresh_token(str(session.user_id), refresh_token.token)
                    logger.debug('Successfully deactivated refresh tokens for session: %s', session.id)

                await self.jwt_manager.revoke_access_token(str(session.user_id), session.session_token)

    async def deactivate_all_sessions(
        self,
        user_id: UUID,
        exclude_current: bool | None = None,
        current_session_id: UUID | None = None,
        current_token: str | None = None,
    ) -> None:
        process_time = datetime.now(timezone.utc).replace(tzinfo=None)
        async with self.db.transaction() as tx:
            await tx.db.update_all(
                SessionModel,
                SessionUpdate(is_active=False, last_activity=process_time).model_dump(exclude_unset=True),
                filter={'user_id': user_id},
                exclude_filter={'id': current_session_id} if exclude_current else None,
            )
            logger.debug('Successfully deactivated all sessions for user: %s', user_id)

            await tx.db.update_all(
                RefreshTokenModel,
                {'is_active': False},
                filter={'user_id': user_id},
                exclude_filter={'session_id': current_session_id} if exclude_current else None,
            )
            logger.debug('Successfully deactivated refresh token for user: %s', user_id)

            await self.jwt_manager.revoke_all_access_tokens(str(user_id), exclude_current, current_token)

    # TODO: deactivate all old sessions, not only the one that is the oldest
    async def limit_max_user_sessions(self, user_id: UUID) -> None:
        async with self.db.transaction() as tx:
            active_sessions = await tx.db.get_all(
                SessionModel,
                filter={'user_id': user_id, 'is_active': True},
                limit=settings.auth.max_sessions + 1,
                order_by='last_activity',
                order_by_desc=False,
            )
            if len(active_sessions) > settings.auth.max_sessions:
                logger.debug('Terminating old session %s for user %s', active_sessions[0].id, user_id)
                await self.deactivate_session(active_sessions[0].session_token)

    async def get_all_sessions(
        self, pagination: Pagination, user_id: UUID, token: str | None = None
    ) -> PagedResponse[SessionResponse]:
        async with self.db.transaction() as tx:
            filter = {'user_id': user_id, 'is_active': True}
            sessions = await tx.db.get_all(
                SessionModel,
                filter=filter,
                limit=pagination.limit,
                offset=(pagination.page - 1) * pagination.limit,
            )

            session_infos = []
            for session in sessions:
                session_info = SessionResponse.model_validate(session)
                session_info.is_current = bool(token and session.session_token == token)
                session_infos.append(session_info)

            total = await tx.db.get_count(SessionModel, filter=filter)
            return PagedResponse[SessionResponse](
                pagination=PaginationParamsInResponse(
                    page=pagination.page,
                    limit=pagination.limit,
                    total=total,
                    total_pages=total // pagination.limit + 1,
                    has_next=pagination.page < (total // pagination.limit + 1),
                ),
                data=[SessionResponse.model_validate(session_info) for session_info in session_infos],
            )

    async def terminate_session(self, user_id: UUID, session_id: UUID) -> UUID:
        async with self.db.transaction() as tx:
            session = await tx.db.get_or_raise(
                SessionModel, filter={'id': session_id, 'user_id': user_id, 'is_active': True}
            )
            await self.deactivate_session(session.session_token)

        logger.debug('Successfully terminated session: %s for user: %s', session_id, user_id)
        return session.id

    async def terminate_all_sessions(
        self, user_id: UUID, exclude_current: bool | None = None, current_token: str | None = None
    ) -> bool:
        if exclude_current:
            async with self.db.transaction() as tx:
                current_session = await tx.db.get(SessionModel, filter={'session_token': current_token})
                if not current_session:
                    raise NotAuthorizedError('Current session not found', same_http_detail_msg=True)
                await self.deactivate_all_sessions(user_id, exclude_current, current_session.id, current_token)
        else:
            await self.deactivate_all_sessions(user_id)
        return True

    async def cleanup_expired_sessions(self) -> int:
        async with self.db.transaction() as tx:
            current_time = datetime.now(timezone.utc).replace(tzinfo=None)
            all_active_sessions = await tx.db.get_all(SessionModel, filter={'is_active': True})

            cleaned_count = 0
            for session in all_active_sessions:
                if session.expires_at < current_time:
                    await self.deactivate_session(session.session_token)
                    cleaned_count += 1

            logger.debug('Successfully cleaned up %d expired sessions', cleaned_count)
            return cleaned_count


async def get_session_service(
    db: DbService = Depends(get_db_service), jwt_manager: JwtService = Depends(get_jwt_service)
) -> SessionService:
    return SessionService(db, jwt_manager)
