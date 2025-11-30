from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from pydantic import ValidationError

from src.core.enums import SocialNames, UserRoles
from src.core.exceptions import NotImplementedError
from src.core.exceptions import ValidationError as CustomValidationError
from src.dependencies import get_current_token, get_current_user, get_current_user_id
from src.schemas import (
    JwtTokenPair,
    LoginForm,
    MessageResponse,
    RegisterForm,
    RequestMeta,
    TelegramUserLogin,
    UserChangePasswordForm,
    UserInToken,
)
from src.services import AuthService, get_auth_service
from src.utils import check_required_role, get_client_ip, get_device_info, get_session_name

router = APIRouter(tags=['auth'])


@router.post('/register')
async def register(
    register_form: RegisterForm,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.user.register(register_form)
    return MessageResponse(msg='Success')


@router.post('/login')
async def login(
    login_form: LoginForm,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> JwtTokenPair:
    user_agent = request.headers.get('User-Agent')
    token_pair = await service.token.create_token_pair(
        login_form,
        meta=RequestMeta(
            user_agent=user_agent,
            ip_address=get_client_ip(request),
            device_info=get_device_info(user_agent),
            session_name=get_session_name(user_agent),
        ),
    )
    user = await service.user.get_user_by_login(login_form.login)
    await service.session.limit_max_user_sessions(user.id)
    return token_pair


@router.post('/login/social/{name}')
async def social_login(
    request: Request,
    name: SocialNames,
    data: dict[str, Any],
    service: AuthService = Depends(get_auth_service),
) -> JwtTokenPair:
    match name:
        case SocialNames.TELEGRAM:
            try:
                user_telegram_data = TelegramUserLogin.model_validate(data)
            except ValidationError as e:
                raise CustomValidationError(
                    f'Telegram user login validation error: {str(e)}', 'Invalid telegram user data'
                )
            user_agent = request.headers.get('User-Agent')
            user = await service.user.get_or_create_user_by_telegram(user_telegram_data)
            token_pair = await service.token.create_token_pair_social(
                user,
                meta=RequestMeta(
                    user_agent=user_agent,
                    ip_address=get_client_ip(request),
                    device_info=get_device_info(user_agent),
                    session_name=get_session_name(SocialNames.TELEGRAM),
                ),
            )
            await service.session.limit_max_user_sessions(user.id)
            return token_pair
        case _:
            raise NotImplementedError(f'Social name {name} is not supported')


@router.post('/refresh')
async def refresh(
    request: Request,
    token: str = Query(..., description='Refresh token'),
    service: AuthService = Depends(get_auth_service),
) -> JwtTokenPair:
    user_agent = request.headers.get('User-Agent')
    token_pair = await service.token.refresh_token_pair(
        token,
        meta=RequestMeta(
            user_agent=user_agent,
            ip_address=get_client_ip(request),
            device_info=get_device_info(user_agent),
            session_name=get_session_name(user_agent),
        ),
    )
    return token_pair


@router.post('/logout')
async def logout(
    token: str = Depends(get_current_token),
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.session.deactivate_session(token)
    return MessageResponse(msg='Success')


@router.post('/forgot-password')
async def forgot_password(
    login: str,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.user.forgot_password(login)
    return MessageResponse(msg='Success')


@router.post('/change-password')
async def change_password(
    change_password_form: UserChangePasswordForm,
    user_id: UUID = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.user.change_password(user_id, change_password_form)
    await service.session.terminate_all_sessions(user_id)
    return MessageResponse(msg='Success')


@router.get('/me')
async def me(
    user: UserInToken = Depends(get_current_user),
) -> UserInToken:
    return user


@router.post('/request-verification')
async def request_verification(
    user_id: UUID = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await service.user.request_verification(user_id)
    return MessageResponse(msg='Success')


@router.post('/check-permission')
async def check_permission(
    role: UserRoles,
    user: UserInToken = Depends(get_current_user),
) -> MessageResponse:
    check_required_role(UserRoles(user.role), role)
    return MessageResponse(msg='Granted')
