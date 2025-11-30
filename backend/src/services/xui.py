from dataclasses import dataclass, field
from datetime import datetime, timezone
from logging import getLogger
from typing import Any

import httpx

from src.core.exceptions import ObjectNotFoundError, XuiError
from src.core.settings import XuiSettings, settings
from src.core.standarts import get_datetime_str
from src.schemas import (
    InboundResponse,
    XuiClient,
    XuiClientUpdate,
    XuiLoginResponse,
    XuiTrojanClientCreate,
    XuiVlessClientCreate,
)

logger = getLogger(__name__)


@dataclass
class XuiService:
    cookies: dict[str, str] = field(default_factory=dict)
    expires_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    access_token: str = field(default='')
    settings: XuiSettings = field(default_factory=lambda: settings.xui)

    def _get_session_id(self, cookies_str: str) -> str:
        return cookies_str.split(';')[0].split('3x-ui=')[1]

    def _get_expires_at(self, cookies_str: str) -> datetime:
        return datetime.strptime(cookies_str.split(';')[2].split('Expires=')[1], '%a, %d %b %Y %H:%M:%S GMT').replace(
            tzinfo=timezone.utc
        )

    async def login(self) -> XuiLoginResponse:
        proccess_datetime = datetime.now(timezone.utc)
        if self.expires_at > proccess_datetime:
            logger.debug('Used stored cookies for login')
            return XuiLoginResponse(
                success=True,
                now_timestamp=get_datetime_str(proccess_datetime),
                session_expires_at=get_datetime_str(self.expires_at),
                new_session=False,
            )
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{self.settings.url}/login',
                    json={
                        'username': self.settings.username,
                        'password': self.settings.password,
                    },
                )
                response.raise_for_status()
                cookies_str: str = response.headers.get('Set-Cookie', '')
                self.expires_at = self._get_expires_at(cookies_str)
                self.cookies.update({'3x-ui': self._get_session_id(cookies_str)})
                logger.debug('Logged with new cookies: %s', self.cookies)
                data = response.json()
                return XuiLoginResponse(
                    success=data['success'],
                    now_timestamp=get_datetime_str(proccess_datetime),
                    session_expires_at=get_datetime_str(self.expires_at),
                    new_session=True,
                )
        except Exception as e:
            logger.error('Failed to xui login: %s', e)
            raise XuiError(log_msg=f'Failed to login: {e}')

    async def get_status(self) -> dict[str, Any]:
        await self.login()
        async with httpx.AsyncClient(cookies=self.cookies) as client:
            response = await client.get(
                f'{self.settings.url}/panel/api/server/status',
            )
            response.raise_for_status()
            data: dict[str, Any] = response.json()
            if data['success']:
                return data
            return {}

    async def ping(self) -> bool:
        if await self.get_status():
            return True
        return False

    async def get_inbounds(self) -> list[InboundResponse]:
        await self.login()
        async with httpx.AsyncClient(cookies=self.cookies) as client:
            response = await client.get(
                f'{self.settings.url}/panel/api/inbounds/list',
            )
            resp = response.json()
            if resp['success'] and response.status_code == 200:
                inbounds = resp['obj']
                return [InboundResponse.model_validate(inbound) for inbound in inbounds]
            else:
                logger.error('Failed to get inbounds: %s', response.json())
                raise XuiError(log_msg=f'Failed to get inbounds: {response.json()}')

    async def get_inbound(self, inbound_id: int) -> InboundResponse:
        """Depricated bad client stats"""
        await self.login()
        async with httpx.AsyncClient(cookies=self.cookies) as client:
            response = await client.get(
                f'{self.settings.url}/panel/api/inbounds/get/{inbound_id}',
            )
            resp = response.json()
            if resp['success'] and response.status_code == 200:
                inbound = resp['obj']
                return InboundResponse.model_validate(inbound)
            else:
                logger.error('Failed to get inbound: %s', response.json())
                raise XuiError(log_msg=f'Failed to get inbound: {response.json()}')

    async def get_inbound_by_remark(self, remark: str) -> InboundResponse:
        await self.login()
        inbounds = await self.get_inbounds()
        for inbound in inbounds:
            if inbound.remark == remark:
                return inbound
        raise ObjectNotFoundError(log_msg=f'Failed to get inbound by remark: {remark}')

    async def get_client_from_inbound(self, inbound_id: int, client_id: str) -> XuiClient:
        await self.login()
        inbounds = await self.get_inbounds()
        for inbound in inbounds:
            if inbound.id == inbound_id:
                for client in inbound.settings.clients:
                    if client.id == client_id:
                        return client
                raise ObjectNotFoundError(log_msg=f'Failed to get client from inbound: {client_id}')
        raise ObjectNotFoundError(log_msg=f'Failed to get inbound: {inbound_id}')

    async def get_client_from_inbound_optional(self, inbound_id: int, client_id: str) -> XuiClient | None:
        await self.login()
        inbound = await self.get_inbound(inbound_id)
        for client in inbound.settings.clients:
            if client.id == client_id:
                return client
        return None

    async def get_client_used_gb(self, inbound_id: int, email: str) -> int:
        await self.login()
        inbounds = await self.get_inbounds()
        for inbound in inbounds:
            if inbound.id == inbound_id:
                for client_stats in inbound.clientStats:
                    if client_stats.email == email:
                        return client_stats.allTime
                raise ObjectNotFoundError(log_msg=f'Failed to get client used GB: {email}')
        raise ObjectNotFoundError(log_msg=f'Failed to get inbound: {inbound_id}')

    async def get_client_from_inbound_by_email(self, inbound_id: int, email: str) -> XuiClient | None:
        await self.login()
        inbounds = await self.get_inbounds()
        for inbound in inbounds:
            if inbound.id == inbound_id:
                for client in inbound.settings.clients:
                    if client.email == email:
                        xui_client = XuiClient.model_validate(client)
                        xui_client.usedGB = await self.get_client_used_gb(inbound_id, client.email)
                        return xui_client
                raise ObjectNotFoundError(log_msg=f'Failed to get client from inbound: {email}')
        raise ObjectNotFoundError(log_msg=f'Failed to get inbound: {inbound_id}')

    async def get_client_from_inbound_by_email_optional(self, inbound_id: int, email: str) -> XuiClient | None:
        await self.login()
        inbound = await self.get_inbound(inbound_id)
        for client in inbound.settings.clients:
            if client.email == email:
                return client
        return None

    async def add_client_to_inbound(
        self, inbound_id: int, client_create: XuiVlessClientCreate | XuiTrojanClientCreate
    ) -> InboundResponse:
        await self.login()
        client_create_json = client_create.model_dump_json()
        logger.debug('Client create json: %s', client_create_json)
        async with httpx.AsyncClient(cookies=self.cookies) as client:
            response = await client.post(
                f'{self.settings.url}/panel/api/inbounds/addClient',
                json={
                    'id': inbound_id,
                    'settings': '{"clients": [' + client_create_json + ']}',
                },
            )
            resp = response.json()
            if resp['success'] and response.status_code == 200:
                logger.debug('Added client to inbound: %s', response.json())
            else:
                logger.error('Failed to add client to inbound: %s', response.json())
                raise XuiError(log_msg=f'Failed to add client to inbound: {response.json()}')
            return await self.get_inbound(inbound_id)

    async def update_client_in_inbound(
        self, inbound_id: int, email: str, client_update: XuiClientUpdate
    ) -> InboundResponse:
        await self.login()
        client_in_inbound = await self.get_client_from_inbound_by_email(inbound_id, email)
        client_id = client_in_inbound.id or client_in_inbound.password

        for attr, value in client_update.model_dump(exclude_none=True).items():
            if value is not None:
                setattr(client_in_inbound, attr, value)

        logger.debug('Client update json: %s', client_update.model_dump_json())

        async with httpx.AsyncClient(cookies=self.cookies) as client:
            response = await client.post(
                f'{self.settings.url}/panel/api/inbounds/updateClient/{client_id}',
                json={
                    'id': inbound_id,
                    'settings': '{"clients": [' + client_in_inbound.model_dump_json() + ']}',
                },
            )
            resp = response.json()
            if resp['success'] and response.status_code == 200:
                logger.debug('Updated client in inbound: %s', response.json())
            else:
                logger.error('Failed to update client in inbound: %s', response.json())
                raise XuiError(log_msg=f'Failed to update client in inbound: {response.json()}')
            return await self.get_inbound(inbound_id)

    async def delete_client_from_inbound(self, inbound_id: int, email: str) -> bool:
        await self.login()
        async with httpx.AsyncClient(cookies=self.cookies) as client:
            client_to_del = await self.get_client_from_inbound_by_email(inbound_id, email)
            client_id = client_to_del.id or client_to_del.password
            response = await client.post(
                f'{self.settings.url}/panel/api/inbounds/{inbound_id}/delClient/{client_id}',
            )
            # TODO add try except to parse response.json()
            resp = response.json()
            if resp['success'] and response.status_code == 200:
                logger.debug('Deleted client from inbound: %s', response.json())
            else:
                logger.error('Failed to delete client from inbound: %s', response.json())
                raise XuiError(log_msg=f'Failed to delete client from inbound: {response.json()}')
            return True

    async def reset_traffic_in_inbound(self, inbound_id: int, email: str) -> bool:
        await self.login()
        async with httpx.AsyncClient(cookies=self.cookies) as client:
            response = await client.post(
                f'{self.settings.url}/panel/api/inbounds/{inbound_id}/resetClientTraffic/{email}',
            )
            resp = response.json()
            if resp['success'] and response.status_code == 200:
                logger.debug('Reset traffic in inbound: %s', response.json())
            else:
                raise XuiError(log_msg=f'Failed to reset traffic in inbound: {response.json()}')
            return True

    async def add_client_to_inbound_by_remark(
        self, client_create: XuiVlessClientCreate | XuiTrojanClientCreate, remark: str
    ) -> InboundResponse:
        inbound = await self.get_inbound_by_remark(remark)
        return await self.add_client_to_inbound(inbound.id, client_create)

    async def update_client_in_inbound_by_remark(
        self, email: str, client_update: XuiClientUpdate, remark: str
    ) -> InboundResponse:
        inbound = await self.get_inbound_by_remark(remark)
        return await self.update_client_in_inbound(inbound.id, email, client_update)

    async def delete_client_from_inbound_by_remark(self, email: str, remark: str) -> bool:
        inbound = await self.get_inbound_by_remark(remark)
        return await self.delete_client_from_inbound(inbound.id, email)

    async def reset_traffic_client_in_inbound_by_remark(self, email: str, remark: str) -> bool:
        inbound = await self.get_inbound_by_remark(remark)
        return await self.reset_traffic_in_inbound(inbound.id, email)


_xui_service_instance: XuiService | None = None


async def get_xui_service() -> XuiService:
    global _xui_service_instance
    if _xui_service_instance is None:
        _xui_service_instance = XuiService()
    return _xui_service_instance
