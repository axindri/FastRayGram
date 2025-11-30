import secrets
from dataclasses import dataclass
from datetime import timedelta
from uuid import UUID

from fastapi import Depends

from src.core.enums import ConfigStatuses, RelatedNames, RequestNames, RequestStatuses, UserRoles, UserStatuses
from src.core.exceptions import ValidationError
from src.models import Config as ConfigModel
from src.models import Request as RequestModel
from src.models import Role as RoleModel
from src.models import User as UserModel
from src.schemas import ConfigLimitsUpdate, ConfigResponse, XuiClientUpdate
from src.services.config import ConfigService, get_config_service
from src.services.db import DbService, get_db_service
from src.services.notification import NotificationService, get_notification_service
from src.services.password import PasswordService, get_password_service
from src.services.session import SessionService, get_session_service
from src.services.xui import XuiService, get_xui_service
from src.utils import get_bytes_from_gb, get_locale_text, get_posix_timestamp_ms


@dataclass
class AdminService:
    db: DbService
    config_service: ConfigService
    xui: XuiService
    pass_manager: PasswordService
    session_service: SessionService
    notification_service: NotificationService

    async def _is_superuser(self, id: UUID) -> bool:
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': id})
            role = await tx.db.get_or_raise(RoleModel, filter={'id': user.role_id})
            return role.name == UserRoles.SUPERUSER

    async def reset_traffic(self, config_id: UUID) -> ConfigResponse:
        async with self.db.transaction() as tx:
            config = await tx.db.get_or_raise(ConfigModel, filter={'id': config_id})
            await self.xui.reset_traffic_client_in_inbound_by_remark(config.client_email, config.type)
            await tx.db.update(ConfigModel, id=config_id, data={'status': ConfigStatuses.UPDATED})
            return ConfigResponse.model_validate(await tx.db.get_or_raise(ConfigModel, filter={'id': config_id}))

    async def add_config_days(self, config_id: UUID, days: int, hours: int) -> ConfigResponse:
        async with self.db.transaction() as tx:
            config = await tx.db.get_or_raise(ConfigModel, filter={'id': config_id})

            expiry_datetime = config.valid_to_dttm + timedelta(days=days, hours=hours)

            await self.xui.update_client_in_inbound_by_remark(
                email=config.client_email,
                client_update=XuiClientUpdate(
                    expiryTime=get_posix_timestamp_ms(expiry_datetime),
                ),
                remark=config.type,
            )
            await tx.db.update(
                ConfigModel,
                id=config.id,
                data={
                    'valid_to_dttm': expiry_datetime,
                },
            )
            return ConfigResponse.model_validate(await tx.db.get_or_raise(ConfigModel, filter={'id': config_id}))

    async def remove_config_days(self, config_id: UUID, days: int, hours: int) -> ConfigResponse:
        async with self.db.transaction() as tx:
            config = await tx.db.get_or_raise(ConfigModel, filter={'id': config_id})

            expiry_datetime = config.valid_to_dttm - timedelta(days=days, hours=hours)

            if expiry_datetime < config.valid_from_dttm:
                expiry_datetime = config.valid_from_dttm

            await self.xui.update_client_in_inbound_by_remark(
                email=config.client_email,
                client_update=XuiClientUpdate(
                    expiryTime=get_posix_timestamp_ms(expiry_datetime),
                ),
                remark=config.type,
            )
            await tx.db.update(
                ConfigModel,
                id=config.id,
                data={
                    'valid_to_dttm': expiry_datetime,
                },
            )
            return ConfigResponse.model_validate(await tx.db.get_or_raise(ConfigModel, filter={'id': config_id}))

    async def update_config_limits(self, config_id: UUID, config_limits_update: ConfigLimitsUpdate) -> ConfigResponse:
        async with self.db.transaction() as tx:
            config = await tx.db.get_or_raise(ConfigModel, filter={'id': config_id})
            await tx.db.update(ConfigModel, id=config.id, data=config_limits_update.model_dump(exclude_unset=True))
            await self.xui.update_client_in_inbound_by_remark(
                email=config.client_email,
                client_update=XuiClientUpdate(
                    limitIp=config.limit_ip,
                    totalGB=get_bytes_from_gb(config.total_gb),
                    expiryTime=get_posix_timestamp_ms(config.valid_to_dttm),
                ),
                remark=config.type,
            )
            return ConfigResponse.model_validate(await tx.db.get_or_raise(ConfigModel, filter={'id': config_id}))

    async def update_user_role(self, id: UUID, role: UserRoles) -> bool:
        async with self.db.transaction() as tx:
            user = await tx.db.get_or_raise(UserModel, filter={'id': id})
            if await self._is_superuser(user.id):
                raise ValidationError('Superuser cannot be updated')
            db_role = await tx.db.get_or_raise(RoleModel, filter={'name': role})
            await tx.db.update(UserModel, user.id, {'role_id': db_role.id})
            await self.verify_user(user.id)
        return True

    async def apply_request(self, id: UUID) -> str:
        msg = 'Success'
        async with self.db.transaction() as tx:
            request = await tx.db.get_or_raise(RequestModel, filter={'id': id})
            match request.name:
                case RequestNames.UPDATE_CONFIG:
                    config = await self.update_config_limits(
                        request.related_id, ConfigLimitsUpdate.model_validate(request.data)
                    )
                    await tx.db.update(ConfigModel, id=request.related_id, data={'status': ConfigStatuses.UPDATED})
                    await self.notification_service.create_user_notification(
                        user_id=request.user_id,
                        request_name=RequestNames.UPDATE_CONFIG,
                        request_status=RequestStatuses.APPLIED,
                        related_name=RelatedNames.CONFIG,
                        related_id=request.related_id,
                        title=get_locale_text('Config update success', 'Конфигурация успешно обновлена'),
                        content=get_locale_text(
                            f'Your config {config.type} has been successfully updated',
                            f'Ваша конфигурация {config.type} успешно обновлена',
                        ),
                    )
                case RequestNames.RENEW_CONFIG:
                    config = await self.update_config_limits(
                        request.related_id, ConfigLimitsUpdate.model_validate(request.data)
                    )
                    await self.reset_traffic(request.related_id)
                    await tx.db.update(ConfigModel, id=request.related_id, data={'status': ConfigStatuses.UPDATED})
                    await self.notification_service.create_user_notification(
                        user_id=request.user_id,
                        request_name=RequestNames.RENEW_CONFIG,
                        request_status=RequestStatuses.APPLIED,
                        related_name=RelatedNames.CONFIG,
                        related_id=request.related_id,
                        title=get_locale_text('Config renewal success', 'Продление конфигурации успешно завершено'),
                        content=get_locale_text(
                            f'Your config {config.type} has been successfully renewed',
                            f'Ваша конфигурация {config.type} успешно продлена',
                        ),
                    )
                case RequestNames.VERIFY:
                    user = await tx.db.get_or_raise(UserModel, filter={'id': request.related_id})
                    await tx.db.update(UserModel, user.id, {'status': UserStatuses.VERIFIED})
                    await self.notification_service.create_user_notification(
                        user_id=request.user_id,
                        request_name=RequestNames.VERIFY,
                        request_status=RequestStatuses.APPLIED,
                        related_name=RelatedNames.USER,
                        related_id=request.related_id,
                        title=get_locale_text('Verification success', 'Верификация успешно завершена'),
                        content=get_locale_text(
                            'Your account successfully verified!', 'Ваш аккаунт успешно верифицирован!'
                        ),
                    )
                case RequestNames.RESET_PASSWORD:
                    password = await self.reset_user_password(request.related_id)
                    await self.notification_service.create_user_notification(
                        user_id=request.user_id,
                        request_name=RequestNames.RESET_PASSWORD,
                        request_status=RequestStatuses.APPLIED,
                        related_name=RelatedNames.USER,
                        related_id=request.related_id,
                        title=get_locale_text('Password reset', 'Сброс пароля'),
                        content=get_locale_text(
                            'Your password has been successfully reset', 'Ваш пароль успешно сброшен'
                        ),
                    )
                    msg = f'Password: {password}'
                case _:
                    raise ValidationError(f'Unknown request name: {request.name}')
            await tx.db.delete(RequestModel, request.id)
        return msg

    async def reset_user_password(self, id: UUID) -> str:
        async with self.db.transaction() as tx:
            if await self._is_superuser(id):
                raise ValidationError('Superuser cannot be verified')
        user = await tx.db.get_or_raise(UserModel, filter={'id': id})
        # Generate cryptographically secure password
        new_password = secrets.token_urlsafe(16)  # 16 bytes = ~22 chars, URL-safe
        await tx.db.update(UserModel, user.id, {'password': self.pass_manager.generate(new_password)})
        await self.session_service.terminate_all_sessions(user.id)
        return new_password

    async def deny_request(self, id: UUID) -> bool:
        async with self.db.transaction() as tx:
            request = await tx.db.get_or_raise(RequestModel, filter={'id': id})
            match request.name:
                case RequestNames.UPDATE_CONFIG:
                    config = await tx.db.get_or_raise(ConfigModel, filter={'id': request.related_id})
                    await tx.db.update(ConfigModel, id=config.id, data={'status': ConfigStatuses.NOT_UPDATED})
                case RequestNames.RENEW_CONFIG:
                    config = await tx.db.get_or_raise(ConfigModel, filter={'id': request.related_id})
                    await tx.db.update(ConfigModel, id=config.id, data={'status': ConfigStatuses.NOT_UPDATED})
                case RequestNames.VERIFY:
                    user = await tx.db.get_or_raise(UserModel, filter={'id': request.related_id})
                    await tx.db.update(UserModel, user.id, {'status': UserStatuses.NOT_VERIFIED})
                case RequestNames.RESET_PASSWORD:
                    pass
                case _:
                    raise ValidationError(f'Unknown request name: {request.name}')
            await tx.db.delete(RequestModel, request.id)
        return True

    async def verify_user(self, id: UUID) -> bool:
        async with self.db.transaction() as tx:
            if await self._is_superuser(id):
                raise ValidationError('Superuser cannot be verified')
            request = await tx.db.get(RequestModel, filter={'related_id': id, 'name': RequestNames.VERIFY})
            if request:
                await self.apply_request(request.id)
            else:
                user = await tx.db.get_or_raise(UserModel, filter={'id': id})
                await tx.db.update(UserModel, user.id, {'status': UserStatuses.VERIFIED})
        return True

    async def unverify_user(self, id: UUID) -> bool:
        async with self.db.transaction() as tx:
            if await self._is_superuser(id):
                raise ValidationError('Superuser cannot be unverified')
            request = await tx.db.get(RequestModel, filter={'related_id': id, 'name': RequestNames.VERIFY})
            if request:
                await self.deny_request(request.id)
            else:
                user = await tx.db.get_or_raise(UserModel, filter={'id': id})
                await tx.db.update(UserModel, user.id, {'status': UserStatuses.NOT_VERIFIED})
        return True


async def get_admin_service(
    db_service: DbService = Depends(get_db_service),
    config_service: ConfigService = Depends(get_config_service),
    xui: XuiService = Depends(get_xui_service),
    pass_manager: PasswordService = Depends(get_password_service),
    session_service: SessionService = Depends(get_session_service),
    notification_service: NotificationService = Depends(get_notification_service),
) -> AdminService:
    return AdminService(db_service, config_service, xui, pass_manager, session_service, notification_service)
