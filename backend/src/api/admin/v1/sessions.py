from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.schemas import MessageResponse
from src.services import AuthService, get_auth_service

router = APIRouter(prefix='/sessions', tags=['sessions'], dependencies=[Depends(required_role(UserRoles.ADMIN))])


@router.post('/revoke/token')
async def revoke_token(
    token: str,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.token.revoke_access_token(token)
    return MessageResponse(msg='Success')


@router.post('/cleanup')
async def cleanup_expired_sessions(
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    cleaned_count = await service.session.cleanup_expired_sessions()
    return MessageResponse(msg=f'Cleaned up {cleaned_count} expired sessions', cleaned_count=str(cleaned_count))
