import hashlib
import hmac
import secrets
from dataclasses import dataclass
from logging import getLogger
from urllib.parse import parse_qsl
from uuid import UUID

from fastapi import Depends

from src.core.enums import (
    AppSettingsNames,
    RelatedNames,
    RequestNames,
    RequestStatuses,
    SocialNames,
    UserRoles,
    UserStatuses,
)
from src.core.exceptions import ObjectUniqueViolationError, RegistrationDisabledError, ValidationError
from src.core.settings import settings
from src.models import AppSettings as AppSettingsModel
from src.models import Notification as NotificationModel
from src.models import Profile as ProfileModel
from src.models import Request as RequestModel
from src.models import Role as RoleModel
from src.models import Session as SessionModel
from src.models import Social as SocialModel
from src.models import User as UserModel
from src.schemas import (
    AccountProfileResponse,
    MessageResponse,
    NotificationResponse,
    PagedResponse,
    Pagination,
    PaginationParamsInResponse,
    ProfileCreate,
    ProfileInAccountProfileResponse,
    ProfileInRegisterSocialForm,
    ProfileUpdate,
    RegisterForm,
    RegisterSocialForm,
    RequestCreate,
    RoleResponse,
    SessionResponse,
    SocialCreate,
    SocialInAccountProfileResponse,
    TelegramUserLogin,
    UserChangePasswordForm,
    UserCreate,
    UserInAccountProfileResponse,
    UserRegisterSocialForm,
)
from src.services.db import DbService, get_db_service
from src.services.notification import NotificationService, get_notification_service
from src.services.password import PasswordService, get_password_service
from src.utils import get_locale_text

logger = getLogger(__name__)


@dataclass
class UserService:
    db: DbService
    pass_manager: PasswordService
    notification_service: NotificationService

    async def register(self, register_form: RegisterForm | RegisterSocialForm) -> UUID:
        logger.debug('Try register new user with login: %s', register_form.user.login)
        async with self.db.transaction() as tx:
            app_settings = await tx.db.get(AppSettingsModel, filter={'name': AppSettingsNames.BASIC})
            if app_settings.values.get('disable_registration', settings.app.disable_registration_startup_param):
                raise RegistrationDisabledError('Registration is disabled', same_http_detail_msg=True)

            if await tx.db.get(UserModel, filter={'login': register_form.user.login}):
                raise ObjectUniqueViolationError(
                    object_name='user', log_msg='already exists', same_http_detail_msg=True
                )

            role = await tx.db.get_or_raise(RoleModel, filter={'name': UserRoles.USER})
            user = await tx.db.create(
                UserModel,
                UserCreate(
                    role_id=role.id,
                    password=self.pass_manager.generate(register_form.user.password),
                    **register_form.user.model_dump(exclude={'password'}),
                ).model_dump(),
            )
            await tx.db.create(
                ProfileModel,
                ProfileCreate(
                    **register_form.profile.model_dump(),
                    user_id=user.id,
                ).model_dump(),
            )
            logger.debug('Successfully create and register new user: %s', user.id)
            return user.id

    async def get_profile(self, user_id: UUID, current_token: str | None = None) -> AccountProfileResponse:
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': user_id})
            sessions = await tx.db.get_all(
                SessionModel,
                filter={'user_id': user.id, 'is_active': True},
                limit=settings.auth.max_sessions,
                order_by='last_activity',
                order_by_desc=True,
            )
            session_infos = []
            for session in sessions:
                session_info = SessionResponse.model_validate(session)
                session_info.is_current = bool(session.session_token == current_token) if current_token else None
                session_infos.append(session_info)

            return AccountProfileResponse(
                user=UserInAccountProfileResponse.model_validate(user),
                profile=ProfileInAccountProfileResponse.model_validate(
                    await tx.db.get_or_raise(ProfileModel, filter={'user_id': user.id}),
                ),
                role=RoleResponse.model_validate(
                    await tx.db.get_or_raise(RoleModel, filter={'id': user.role_id}),
                ),
                socials=[
                    SocialInAccountProfileResponse.model_validate(social)
                    for social in await tx.db.get_all(SocialModel, filter={'user_id': user.id})
                ],
                sessions=[SessionResponse.model_validate(session_info) for session_info in session_infos],
            )

    async def get_notifications(self, user_id: UUID, pagination: Pagination) -> PagedResponse[NotificationResponse]:
        async with self.db.transaction() as tx:
            notifications = await tx.db.get_all(
                NotificationModel,
                filter={'user_id': user_id},
                limit=pagination.limit,
                offset=(pagination.page - 1) * pagination.limit,
                order_by='_inserted_dttm',
                order_by_desc=True,
            )
            total = await tx.db.get_count(NotificationModel, filter={'user_id': user_id})
            total_pages = (total + pagination.limit - 1) // pagination.limit if total > 0 else 0
            return PagedResponse[NotificationResponse](
                pagination=PaginationParamsInResponse(
                    page=pagination.page,
                    limit=pagination.limit,
                    total=total,
                    total_pages=total_pages,
                    has_next=pagination.page < total_pages,
                ),
                data=[NotificationResponse.model_validate(notification) for notification in notifications],
            )

    async def update_profile(
        self, user_id: UUID, profile_update: ProfileUpdate, token: str | None = None
    ) -> AccountProfileResponse:
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': user_id})
            profile = await tx.db.get_or_raise(ProfileModel, filter={'user_id': user.id})
            await tx.db.update(ProfileModel, profile.id, profile_update.model_dump(exclude_unset=True))
            return await self.get_profile(user_id, token)

    async def request_verification(self, user_id: UUID) -> bool:
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': user_id})
            await tx.db.create(
                RequestModel,
                RequestCreate(
                    user_id=user.id, name=RequestNames.VERIFY, related_id=user.id, related_name='user', data={}
                ).model_dump(),
            )
            await tx.db.update(UserModel, user.id, {'status': UserStatuses.VERIFICATION_PENDING})
            await self.notification_service.create_admins_notification(
                request_name=RequestNames.VERIFY,
                request_status=RequestStatuses.NEW,
                related_name=RelatedNames.USER,
                related_id=user.id,
                title=get_locale_text(
                    '⚠️ [ADMIN] Verification request',
                    '⚠️ [АДМИН] Запрос на верификацию',
                ),
                content=get_locale_text(
                    f'User {user.login} has requested verification',
                    f'Пользователь {user.login} запросил верификацию',
                ),
            )

        return True

    async def get_user_by_login(self, login: str) -> UserModel:
        async with self.db.transaction() as tx:
            return await tx.db.get_or_raise(UserModel, filter={'login': login})

    async def change_password(self, user_id: UUID, change_password_form: UserChangePasswordForm) -> MessageResponse:
        if change_password_form.old_password == change_password_form.new_password:
            raise ValidationError('New password cannot be the same as the old password', same_http_detail_msg=True)
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': user_id})
            if not self.pass_manager.verify(change_password_form.old_password, user.password):
                raise ValidationError('Invalid old password', same_http_detail_msg=True)
            request = await tx.db.get(RequestModel, filter={'user_id': user.id, 'name': RequestNames.RESET_PASSWORD})
            if request:
                await tx.db.delete(RequestModel, id=request.id)
            await tx.db.update(
                UserModel, user.id, {'password': self.pass_manager.generate(change_password_form.new_password)}
            )
            return MessageResponse(msg='Success')

    async def forgot_password(self, login: str) -> bool:
        async with self.db.transaction() as tx:
            user = await tx.db.get(UserModel, filter={'login': login})
            if user:
                request = await tx.db.get(
                    RequestModel, filter={'user_id': user.id, 'name': RequestNames.RESET_PASSWORD}
                )
                if not request:
                    await tx.db.create(
                        RequestModel,
                        RequestCreate(
                            user_id=user.id,
                            name=RequestNames.RESET_PASSWORD,
                            related_id=user.id,
                            related_name='user',
                            data={},
                        ).model_dump(),
                    )
                    await self.notification_service.create_admins_notification(
                        request_name=RequestNames.RESET_PASSWORD,
                        request_status=RequestStatuses.NEW,
                        related_name=RelatedNames.USER,
                        related_id=user.id,
                        title=get_locale_text(
                            '⚠️ [ADMIN] Password reset request',
                            '⚠️ [АДМИН] Запрос на сброс пароля',
                        ),
                        content=get_locale_text(
                            f'User {user.login} has requested password reset',
                            f'Пользователь {user.login} запросил сброс пароля',
                        ),
                    )
        return True

    async def reset_password(self, user_id: UUID) -> str:
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': user_id})
            request = await tx.db.get(RequestModel, filter={'user_id': user.id, 'name': RequestNames.RESET_PASSWORD})
            if request:
                await tx.db.delete(RequestModel, id=request.id)
            # Generate cryptographically secure password
            new_password = secrets.token_urlsafe(16)  # 16 bytes = ~22 chars, URL-safe
            await tx.db.update(UserModel, user.id, {'password': self.pass_manager.generate(new_password)})
            return f'Password: {new_password}'

    def _check_telegram_webapp_hash(self, bot_token: str, init_data_str: str) -> bool:
        try:
            params = dict[str, str](parse_qsl(init_data_str, keep_blank_values=True))
            received_hash = params.pop('hash', None)
            if not received_hash:
                logger.error('No hash parameter found in init_data_str')
                return False

        except Exception as e:
            logger.error('Failed to parse init_data_str: %s', str(e))
            return False

        sorted_params = sorted(params.items())
        data_check_string = '\n'.join(f'{k}={v}' for k, v in sorted_params)

        logger.debug('Data check string: %s', data_check_string)
        logger.debug('Included parameters: %s', list[str](params.keys()))

        clean_token = bot_token.strip()
        if clean_token.startswith('Bot '):
            clean_token = clean_token[4:]

        secret_key = hmac.new(key=b'WebAppData', msg=clean_token.encode('utf-8'), digestmod=hashlib.sha256).digest()

        calculated_hash = hmac.new(
            key=secret_key, msg=data_check_string.encode('utf-8'), digestmod=hashlib.sha256
        ).hexdigest()

        logger.debug('Calculated hash: %s, received hash: %s', calculated_hash, received_hash)
        return hmac.compare_digest(calculated_hash, received_hash)

    async def get_or_create_user_by_telegram(
        self,
        telegram_user: TelegramUserLogin,
    ) -> UserModel:
        if not self._check_telegram_webapp_hash(settings.app.telegram_bot_token, telegram_user.init_data_str):
            raise ValidationError('Invalid Telegram WebApp hash', 'Something went wrong at telegram authentication')

        async with self.db.transaction() as tx:
            logger.debug('Try to log in: %s', telegram_user)
            social = await tx.db.get(
                SocialModel, filter={'name': SocialNames.TELEGRAM.value.lower(), 'login': str(telegram_user.id)}
            )
            if not social:
                # Generate cryptographically secure password
                password = secrets.token_urlsafe(16)  # 16 bytes = ~22 chars, URL-safe
                user_id = await self.register(
                    RegisterSocialForm(
                        user=UserRegisterSocialForm(
                            login=f'#{SocialNames.TELEGRAM.value.lower()}_{str(telegram_user.id)}',
                            password=password,
                        ),
                        profile=ProfileInRegisterSocialForm(
                            first_name=telegram_user.first_name[:255],
                            last_name=telegram_user.last_name[:255] if telegram_user.last_name else None,
                            lang_code=telegram_user.language_code.lower(),
                        ),
                    )
                )
                await tx.db.create(
                    SocialModel,
                    SocialCreate(
                        name=SocialNames.TELEGRAM.value.lower(),
                        login=str(telegram_user.id),
                        user_id=user_id,
                        email=telegram_user.username,
                    ).model_dump(),
                )
                return await tx.db.get_or_raise(UserModel, filter={'id': user_id})
            return await tx.db.get_or_raise(UserModel, filter={'id': social.user_id})


async def get_user_service(
    db: DbService = Depends(get_db_service),
    pass_manager: PasswordService = Depends(get_password_service),
    notification_service: NotificationService = Depends(get_notification_service),
) -> UserService:
    return UserService(db, pass_manager, notification_service)
