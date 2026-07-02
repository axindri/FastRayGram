import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

from fastapi import HTTPException
from httpx import AsyncClient

from src.core.logger import logger
from src.core.settings import settings
from src.models.xui import ClientResponse, CreateClientRequest, UpdateClientRequest


@dataclass
class XuiService:
    url: str
    api_key: str
    timeout: int

    async def get_version(self) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        response = await AsyncClient(timeout=2).get(f"{self.url}/panel/api/server/status", headers=headers)
        response.raise_for_status()
        data = response.json()
        logger.debug(f"XUI status data: {data}")
        return data["obj"]["panelVersion"]

    async def get_inbounds_ids(self) -> list[int]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        response = await AsyncClient(timeout=self.timeout).get(
            f"{self.url}/panel/api/inbounds/list/slim", headers=headers
        )
        response.raise_for_status()
        data = response.json()
        return [int(item["id"]) for item in data["obj"] if item["enable"] is True]

    async def add_client_to_inbounds(self, client: CreateClientRequest, inbounds_ids: list[int] | None = None) -> str:
        if inbounds_ids is None:
            inbounds_ids = await self.get_inbounds_ids()
        client_payload: dict[str, str | int | bool] = {
            "email": client.email,
            "subId": str(uuid.uuid4()),
            "comment": client.comment,
            "totalGB": client.total_gb * (1024**3),
            "expiryTime": int((datetime.now() + timedelta(days=client.expiry_time_days)).timestamp()) * 1000,
            "limitIp": client.limit_ips,
            "enable": client.enable,
        }
        if client.flow:
            client_payload["flow"] = client.flow

        data = {
            "client": client_payload,
            "inboundIds": inbounds_ids,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        response = await AsyncClient(timeout=self.timeout).post(
            f"{self.url}/panel/api/clients/add", headers=headers, json=data
        )
        response.raise_for_status()
        data = response.json()
        if data["success"] is False:
            logger.error(f"XUI Error while adding client: {data['msg'].replace('\n', '')}")
            raise HTTPException(status_code=400, detail="Something went wrong")
        return str(data["success"])

    async def get_client_by_email(self, email: str) -> ClientResponse | None:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        response = await AsyncClient(timeout=self.timeout).get(
            f"{self.url}/panel/api/clients/get/{email}", headers=headers
        )
        response.raise_for_status()
        data = response.json()
        if data["success"] is False:
            return None
        inbound_ids = [int(item) for item in data["obj"]["inboundIds"]]
        used_traffic = data["obj"]["usedTraffic"]
        logger.debug(f"XUI client data: {data['obj']['client']}")
        return ClientResponse(
            id=data["obj"]["client"]["id"],
            email=data["obj"]["client"]["email"],
            inbound_ids=inbound_ids,
            used_traffic=used_traffic,
            sub_url=f"{settings.xui.sub_url}/{data['obj']['client']['subId']}",
            sub_id=data["obj"]["client"]["subId"],
            uuid=data["obj"]["client"]["uuid"],
            flow=data["obj"]["client"]["flow"],
            limit_ips=data["obj"]["client"]["limitIp"],
            total_gb=round(data["obj"]["client"]["totalGB"] / (1024**3), 2),
            enable=data["obj"]["client"]["enable"],
            expiry_datetime=datetime.fromtimestamp(data["obj"]["client"]["expiryTime"] / 1000),
            comment=data["obj"]["client"]["comment"],
        )

    async def update_client_by_email(self, email: str, client: UpdateClientRequest) -> None:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        payload: dict[str, str | int | bool] = {
            "email": email,
            "expiryTime": int((datetime.now() + timedelta(days=client.expiry_time_days)).timestamp()) * 1000,
            "enable": client.enable,
        }
        if client.limit_ips is not None:
            payload["limitIp"] = client.limit_ips

        response = await AsyncClient(timeout=self.timeout).post(
            f"{self.url}/panel/api/clients/update/{email}",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        if data["success"] is False:
            logger.error(f"XUI Error while updating client: {data['msg'].replace('\n', '')}")
            raise HTTPException(status_code=400, detail="Something went wrong")
        return str(data["success"])

    async def reset_client_traffic_by_email(self, email: str) -> None:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        response = await AsyncClient(timeout=self.timeout).post(
            f"{self.url}/panel/api/clients/resetTraffic/{email}", headers=headers
        )
        response.raise_for_status()
        data = response.json()
        if data["success"] is False:
            logger.error(f"XUI Error while resetting client traffic: {data['msg'].replace('\n', '')}")
            raise HTTPException(status_code=400, detail="Something went wrong")
        return str(data["success"])

    async def delete_client_by_email(self, email: str) -> None:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        response = await AsyncClient(timeout=self.timeout).post(
            f"{self.url}/panel/api/clients/del/{email}?keepTraffic=1", headers=headers
        )
        response.raise_for_status()
        data = response.json()
        if data["success"] is False:
            logger.error(f"XUI Error while deleting client: {data['msg'].replace('\n', '')}")
            raise HTTPException(status_code=400, detail="Something went wrong")
        return str(data["success"])


async def get_xui_service() -> XuiService:
    return XuiService(
        url=settings.xui.url,
        api_key=settings.xui.api_key,
        timeout=settings.app.request_timeout,
    )
