from typing import Any

from fastapi import APIRouter, Depends

from src.core.enums import ConfigTypes, UserRoles
from src.dependencies import required_role
from src.schemas import InboundResponse
from src.services import XuiService, get_xui_service

router = APIRouter(prefix='/xui', tags=['xui'], dependencies=[Depends(required_role(UserRoles.ADMIN))])


@router.get('/status')
async def status(service: XuiService = Depends(get_xui_service)) -> dict[str, Any]:
    return await service.get_status()


@router.get('/inbounds')
async def get_inbounds(service: XuiService = Depends(get_xui_service)) -> list[InboundResponse]:
    return await service.get_inbounds()


@router.get('/inbounds/{remark}')
async def get_inbound_by_remark(
    remark: ConfigTypes,
    service: XuiService = Depends(get_xui_service),
) -> InboundResponse:
    return await service.get_inbound_by_remark(remark)
