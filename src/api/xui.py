from fastapi import APIRouter, Depends, HTTPException

from src.core.deps import require_roles
from src.core.enums import Role
from src.models.xui import ClientResponse, CreateClientRequest, UpdateClientRequest
from src.services.xui import XuiService, get_xui_service

router = APIRouter(prefix="/xui", tags=["xui"], dependencies=[Depends(require_roles(Role.SUPERUSER, Role.ADMIN))])


@router.get("/inbounds")
async def get_inbounds(xui_service: XuiService = Depends(get_xui_service)) -> list[int]:
    return await xui_service.get_inbounds_ids()


@router.post("/clients/add")
async def add_client(client: CreateClientRequest, xui_service: XuiService = Depends(get_xui_service)) -> str:
    return await xui_service.add_client_to_inbounds(client)


@router.get("/clients/get/{email}")
async def get_client(email: str, xui_service: XuiService = Depends(get_xui_service)) -> ClientResponse:
    client = await xui_service.get_client_by_email(email)
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/clients/update/{email}")
async def update_client(
    email: str, client: UpdateClientRequest, xui_service: XuiService = Depends(get_xui_service)
) -> str:
    return await xui_service.update_client_by_email(email, client)


@router.post("/clients/reset-traffic/{email}")
async def reset_client_traffic(email: str, xui_service: XuiService = Depends(get_xui_service)) -> str:
    return await xui_service.reset_client_traffic_by_email(email)


@router.delete("/clients/delete/{email}")
async def delete_client(email: str, xui_service: XuiService = Depends(get_xui_service)) -> str:
    return await xui_service.delete_client_by_email(email)
