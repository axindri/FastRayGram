import base64
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from logging import getLogger
from uuid import UUID, uuid4

import httpx
from fastapi import Depends

from src.core.enums import (
    ConfigStatuses,
    ConfigTypes,
    RelatedNames,
    RequestNames,
    RequestStatuses,
    XuiCreateClientComments,
)
from src.core.exceptions import ObjectNotFoundError, ValidationError
from src.core.settings import settings
from src.core.standarts import get_datetime_str
from src.models import AppSettings, Config, Request
from src.schemas import (
    ConfigCreate,
    ConfigRequestLimitsUpdate,
    ConfigResponse,
    ConfigSimpleResponse,
    ConfigUpdate,
    InboundResponse,
    PagedResponse,
    Pagination,
    PaginationParamsInResponse,
    RequestCreate,
    XuiClient,
    XuiTrojanClientCreate,
    XuiVlessClientCreate,
)
from src.services.db import DbService, get_db_service
from src.services.notification import NotificationService, get_notification_service
from src.services.xui import XuiService, get_xui_service
from src.utils import (
    get_bytes_from_gb,
    get_datetime_from_posix_timestamp_ms,
    get_gb_from_bytes,
    get_locale_text,
    get_posix_timestamp_ms,
)

logger = getLogger(__name__)


@dataclass
class ConfigService:
    db: DbService
    xui: XuiService
    notification_service: NotificationService

    @staticmethod
    async def _get_conn_url_from_sub(subscription_url: str) -> str | None:
        html_str = ''
        async with httpx.AsyncClient() as client:
            logger.debug('Getting connection url from subscription url %s', subscription_url)
            response = await client.get(subscription_url)
        if response.status_code == 200:
            try:
                decoded_bytes = base64.b64decode(response.text.strip())
                html_str = decoded_bytes.decode('utf-8').strip().split('\n')[0]
                logger.debug('Decoded Base64 response: %s', html_str)
            except Exception:
                html_str = response.text
                logger.debug('Using response directly %s', html_str)

        return html_str

    def _make_conn_url_comment(self, remark: str | None, url: str | None) -> str:
        if url and '#' in url:
            url = url.split('#')[0] + f'#{remark}-fast-ray-gram'
        return url

    async def _get_conn_url(self, inbound: InboundResponse, client: XuiClient) -> str | None:
        subscription = f'{settings.xui.subscription_url}/{client.subId}'
        connection_url = await self._get_conn_url_from_sub(subscription)
        connection_url = self._make_conn_url_comment(inbound.remark, connection_url)
        if connection_url:
            logger.debug('Get connection url from subscription url %s', subscription)
            return connection_url
        else:
            if inbound.remark == ConfigTypes.VLESS:
                user_id = client.id
                server_host = settings.xui.host
                server_port = inbound.port
                encryption = inbound.settings.encryption
                flow = client.flow
                fp = inbound.streamSettings.realitySettings.settings.get('fingerprint', 'chrome')  # type: ignore
                pbk = inbound.streamSettings.realitySettings.settings.get('publicKey', '')  # type: ignore
                security = inbound.streamSettings.security
                sid = (
                    inbound.streamSettings.realitySettings.shortIds[0]  # type: ignore
                    if inbound.streamSettings.realitySettings.shortIds  # type: ignore
                    else ''
                )
                sni = (
                    inbound.streamSettings.realitySettings.serverNames[0]  # type: ignore
                    if inbound.streamSettings.realitySettings.serverNames  # type: ignore
                    else ''
                )
                spx = inbound.streamSettings.realitySettings.settings.get('spiderX', '%2F')  # type: ignore
                network_type = inbound.streamSettings.network
                comment = f'{inbound.remark}-fast-ray-gram'

                return (
                    f'vless://{user_id}@{server_host}:{server_port}'
                    f'?encryption={encryption}'
                    f'&flow={flow}'
                    f'&fp={fp}'
                    f'&pbk={pbk}'
                    f'&security={security}'
                    f'&sid={sid}'
                    f'&sni={sni}'
                    f'&spx={spx}'
                    f'&type={network_type}'
                    f'#{comment}'
                )
            elif inbound.remark == ConfigTypes.TROJAN:
                password = client.password
                server_host = settings.xui.host
                server_port = inbound.port
                security = inbound.streamSettings.security
                network_type = inbound.streamSettings.network
                comment = f'{inbound.remark}-{client.email}'
                return (
                    f'trojan://{password}@{server_host}:{server_port}?security={security}&type={network_type}#{comment}'
                )
            return None

    async def get_or_create_config(self, user_id: UUID, config_type: ConfigTypes) -> ConfigResponse:
        proccess_datetime = datetime.now(timezone.utc).replace(tzinfo=None)

        inbound_remark = config_type
        email = f'{config_type}_{user_id}'
        comment = f'{XuiCreateClientComments.CREATED_AUTO}:{proccess_datetime.strftime("[%Y-%m-%dT%H:%M:%S]")}'

        async with self.db.transaction() as tx:
            inbound = await self.xui.get_inbound_by_remark(inbound_remark)
            client = await self.xui.get_client_from_inbound_by_email_optional(inbound.id, email)
            config = await tx.db.get(Config, filter={'user_id': user_id, 'type': config_type})

            if not config and not client:
                limit_ip = settings.app.base_limit_ip
                total_gb = settings.app.base_total_gb
                total_bytes = get_bytes_from_gb(total_gb)
                expiry_datetime = proccess_datetime + timedelta(days=settings.app.promo_days)
                client_id = str(uuid4())
                password = str(uuid4())

                logger.debug('Create new client in xui: %s', email)
                if config_type == ConfigTypes.VLESS:
                    await self.xui.add_client_to_inbound_by_remark(
                        client_create=XuiVlessClientCreate(
                            id=client_id,
                            comment=comment,
                            email=email,
                            expiryTime=get_posix_timestamp_ms(expiry_datetime),
                            limitIp=limit_ip,
                            subId=email,
                            totalGB=total_bytes,
                        ),
                        remark=inbound_remark,
                    )
                if config_type == ConfigTypes.TROJAN:
                    await self.xui.add_client_to_inbound_by_remark(
                        client_create=XuiTrojanClientCreate(
                            password=password,
                            comment=comment,
                            email=email,
                            expiryTime=get_posix_timestamp_ms(expiry_datetime),
                            limitIp=limit_ip,
                            subId=email,
                            totalGB=total_bytes,
                        ),
                        remark=inbound_remark,
                    )
                new_client = await self.xui.get_client_from_inbound_by_email(inbound.id, email)
                logger.debug('Create new config in db for user: %s, client_id: %s and xui', user_id, client_id)
                config_create = ConfigCreate(
                    type=config_type,
                    user_id=user_id,
                    client_id=client_id if config_type == ConfigTypes.VLESS else password,
                    client_email=email,
                    used_gb=0,
                    total_gb=total_gb,
                    limit_ip=limit_ip,
                    subscription_url=f'{settings.xui.subscription_url}/{email}',
                    connection_url=await self._get_conn_url(inbound, new_client),
                    valid_from_dttm=proccess_datetime,
                    valid_to_dttm=expiry_datetime,
                )
                return ConfigResponse.model_validate(await tx.db.create(Config, data=config_create.model_dump()))

            if not config and client:
                logger.debug('Restore existing config user: %s, client_id: %s from xui', user_id, client.id)
                config_create = ConfigCreate(
                    type=config_type,
                    user_id=user_id,
                    client_id=client.id or client.password,
                    client_email=client.email,
                    used_gb=get_gb_from_bytes(client.usedGB),
                    total_gb=int(get_gb_from_bytes(client.totalGB)),
                    limit_ip=client.limitIp,
                    subscription_url=f'{settings.xui.subscription_url}/{client.email}',
                    connection_url=await self._get_conn_url(inbound, client),
                    valid_from_dttm=proccess_datetime,
                    valid_to_dttm=get_datetime_from_posix_timestamp_ms(client.expiryTime),
                )
                return ConfigResponse.model_validate(await tx.db.create(Config, data=config_create.model_dump()))

            if config and not client:
                logger.debug('Restore existing client in xui: %s from db', email)

                if config_type == ConfigTypes.VLESS:
                    await self.xui.add_client_to_inbound_by_remark(
                        client_create=XuiVlessClientCreate(
                            id=str(config.client_id),
                            subId=email,
                            email=email,
                            limitIp=config.limit_ip,
                            totalGB=get_bytes_from_gb(config.total_gb),
                            comment=comment,
                            expiryTime=get_posix_timestamp_ms(config.valid_to_dttm),
                        ),
                        remark=inbound_remark,
                    )
                if config_type == ConfigTypes.TROJAN:
                    await self.xui.add_client_to_inbound_by_remark(
                        client_create=XuiTrojanClientCreate(
                            password=str(config.client_id),
                            email=email,
                            subId=email,
                            limitIp=config.limit_ip,
                            totalGB=get_bytes_from_gb(config.total_gb),
                            comment=comment,
                            expiryTime=get_posix_timestamp_ms(config.valid_to_dttm),
                        ),
                        remark=inbound_remark,
                    )
                return ConfigResponse.model_validate(config)

            if config and client:
                logger.debug(
                    'Return existing config from db for user: %s, client_id: %s',
                    config.user_id,
                    config.client_id,
                )
                new_client = await self.xui.get_client_from_inbound_by_email(inbound.id, email)
                config_update = ConfigUpdate(
                    used_gb=get_gb_from_bytes(new_client.usedGB),
                    total_gb=int(get_gb_from_bytes(new_client.totalGB)),
                    limit_ip=new_client.limitIp,
                    subscription_url=f'{settings.xui.subscription_url}/{new_client.email}',
                    connection_url=await self._get_conn_url(inbound, new_client),
                )
                await tx.db.update(Config, id=config.id, data=config_update.model_dump(exclude_unset=True))
                new_config = await tx.db.get_or_raise(Config, filter={'id': config.id})
                return ConfigResponse.model_validate(new_config)

            else:
                raise ObjectNotFoundError(log_msg=f'Config or client are not found for user: {user_id}')

    async def get_configs_simple(self, pagination: Pagination, user_id: UUID) -> PagedResponse[ConfigSimpleResponse]:
        async with self.db.transaction() as tx:
            objs = await tx.db.get_all(
                Config,
                filter={'user_id': user_id},
                limit=pagination.limit,
                offset=(pagination.page - 1) * pagination.limit,
            )
            total = await tx.db.get_count(Config, filter={'user_id': user_id})
            return PagedResponse[ConfigSimpleResponse](
                pagination=PaginationParamsInResponse(
                    page=pagination.page,
                    limit=pagination.limit,
                    total=total,
                    total_pages=total // pagination.limit + 1,
                    has_next=pagination.page < (total // pagination.limit + 1),
                ),
                data=[ConfigSimpleResponse.model_validate(obj) for obj in objs],
            )

    async def create_renew_request(self, user_id: UUID, config_id: UUID) -> bool:
        proccess_datetime = datetime.now(timezone.utc).replace(tzinfo=None)
        async with self.db.transaction() as tx:
            config = await tx.db.get_or_raise(Config, filter={'id': config_id, 'user_id': user_id})
            await tx.db.create(
                Request,
                data=RequestCreate(
                    user_id=user_id,
                    name=RequestNames.RENEW_CONFIG,
                    related_id=config_id,
                    related_name='config',
                    data={
                        'valid_to_dttm': get_datetime_str(proccess_datetime + timedelta(days=settings.app.expiry_days)),
                        'used_gb': 0,
                    },
                ).model_dump(),
            )
            await tx.db.update(Config, id=config_id, data={'status': ConfigStatuses.UPDATE_PENDING})

            await self.notification_service.create_admins_notification(
                request_name=RequestNames.RENEW_CONFIG,
                request_status=RequestStatuses.NEW,
                related_name=RelatedNames.CONFIG,
                related_id=config_id,
                title=get_locale_text(
                    '⚠️ [ADMIN] Config renewal request',
                    '⚠️ [АДМИН] Заявка на продление конфигурации',
                ),
                content=get_locale_text(
                    f'New renewal request for config {config.type}, {config.client_email}',
                    f'Новая заявка на продление конфигурации {config.type}, {config.client_email}',
                ),
            )
            return True

    async def create_update_limits_request(
        self, user_id: UUID, config_id: UUID, limits_update: ConfigRequestLimitsUpdate
    ) -> bool:
        async with self.db.transaction() as tx:
            service_settings = await tx.db.get_or_raise(AppSettings, filter={'name': 'service'})
            max_limit_ip = service_settings.values.get('max_limit_ip', settings.app.max_limit_ip_startup_param)
            max_total_gb = service_settings.values.get('max_total_gb', settings.app.max_total_gb_startup_param)

            if limits_update.total_gb and limits_update.total_gb > max_total_gb:
                raise ValidationError(
                    f'Total GB is greater than max total GB: {max_total_gb}', same_http_detail_msg=True
                )
            if limits_update.limit_ip and limits_update.limit_ip > max_limit_ip:
                raise ValidationError(
                    f'Limit IP is greater than max limit IP: {max_limit_ip}', same_http_detail_msg=True
                )

            config = await tx.db.get_or_raise(Config, filter={'id': config_id, 'user_id': user_id})
            await tx.db.create(
                Request,
                data=RequestCreate(
                    user_id=user_id,
                    name=RequestNames.UPDATE_CONFIG,
                    related_id=config_id,
                    related_name='config',
                    data=limits_update.model_dump(exclude_unset=True),
                ).model_dump(),
            )
            await tx.db.update(Config, id=config_id, data={'status': ConfigStatuses.UPDATE_PENDING})
            await self.notification_service.create_admins_notification(
                request_name=RequestNames.UPDATE_CONFIG,
                request_status=RequestStatuses.NEW,
                related_name=RelatedNames.CONFIG,
                related_id=config_id,
                title=get_locale_text(
                    '⚠️ [ADMIN] Config update request',
                    '⚠️ [АДМИН] Заявка на обновление конфигурации',
                ),
                content=get_locale_text(
                    f'New update request for config {config.type}, {config.client_email}',
                    f'Новая заявка на обновление конфигурации {config.type}, {config.client_email}',
                ),
            )
            return True


async def get_config_service(
    db_service: DbService = Depends(get_db_service),
    xui_service: XuiService = Depends(get_xui_service),
    notification_service: NotificationService = Depends(get_notification_service),
) -> ConfigService:
    return ConfigService(db=db_service, xui=xui_service, notification_service=notification_service)
