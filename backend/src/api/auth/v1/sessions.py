from uuid import UUID

from fastapi import APIRouter, Depends

from src.dependencies import get_current_token, get_current_user_id, get_pagination
from src.schemas import MessageResponse, PagedResponse, Pagination, SessionResponse
from src.services.auth import AuthService, get_auth_service

router = APIRouter(prefix='/sessions', tags=['sessions'])


@router.get('/')
async def get_all_sessions(
    token: str = Depends(get_current_token),
    user_id: UUID = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
    pagination: Pagination = Depends(get_pagination),
) -> PagedResponse[SessionResponse]:
    return await service.session.get_all_sessions(pagination, user_id, token)


@router.delete('/terminate/{session_id}')
async def terminate_session(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.session.terminate_session(user_id, session_id)
    return MessageResponse(msg='Success')


@router.delete('/terminate-all')
async def terminate_all_sessions(
    exclude_current: bool = True,
    token: str = Depends(get_current_token),
    user_id: UUID = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.session.terminate_all_sessions(user_id, exclude_current, token)
    return MessageResponse(
        msg='Successfully terminated all active sessions' + (', except current' if exclude_current else '')
    )
