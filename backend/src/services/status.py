from dataclasses import dataclass
from datetime import datetime, timezone
from logging import getLogger

from fastapi import Depends

from src.core.enums import AppStatuses
from src.core.settings import settings
from src.core.standarts import get_datetime_str
from src.schemas import AppStatusResponse, StatusesResponse
from src.services.db import DbService, get_db_service
from src.services.redis import RedisService, get_rate_limiter_redis_service, get_redis_service
from src.services.xui import XuiService, get_xui_service

logger = getLogger(__name__)


@dataclass
class StatusService:
    db: DbService
    redis: RedisService
    rate_limiter_redis: RedisService
    xui: XuiService

    async def _get_db_status(self) -> AppStatuses:
        try:
            async with self.db.transaction() as tx:
                await tx.db.ping()
                return AppStatuses.OK
        except Exception as e:
            logger.error('Error getting DB status: %s', e)
            return AppStatuses.ERROR

    async def _get_redis_status(self) -> AppStatuses:
        try:
            await self.redis.ping()
            return AppStatuses.OK
        except Exception as e:
            logger.error('Error getting Redis status: %s', e)
            return AppStatuses.ERROR

    async def _get_rate_limiter_redis_status(self) -> AppStatuses:
        try:
            await self.rate_limiter_redis.ping()
            return AppStatuses.OK
        except Exception as e:
            logger.error('Error getting Redis status: %s', e)
            return AppStatuses.ERROR

    async def _get_xui_status(self) -> AppStatuses:
        try:
            await self.xui.ping()
            return AppStatuses.OK
        except Exception as e:
            logger.error('Error getting XUI status: %s', e)
            return AppStatuses.ERROR

    async def get_status(self) -> AppStatusResponse:
        process_time = datetime.now().replace(tzinfo=timezone.utc)
        uptime_seconds = (process_time - settings.app.start_time).total_seconds()
        statuses = [
            await self._get_db_status(),
            await self._get_redis_status(),
            await self._get_rate_limiter_redis_status(),
            await self._get_xui_status(),
        ]
        total_status = AppStatuses.WARNING if AppStatuses.WARNING in statuses else AppStatuses.OK
        total_status = AppStatuses.ERROR if AppStatuses.ERROR in statuses else AppStatuses.OK
        app_status = AppStatusResponse(
            statuses=StatusesResponse(
                total=total_status,
                api=AppStatuses.OK,
                db=statuses[0],
                redis=statuses[1],
                rate_limiter_redis=statuses[2],
                xui=statuses[3],
                allowed_statuses=list[AppStatuses](AppStatuses),
            ),
            now_timestamp=get_datetime_str(process_time),
            uptime=(
                f'{int(uptime_seconds // 86400)} days, '
                f'{int(uptime_seconds // 3600)} hours, '
                f'{int((uptime_seconds % 3600) // 60)} minutes, '
                f'{int(uptime_seconds % 60)} seconds'
            ),
        )
        logger.debug('Get service status: %s', app_status)
        return app_status


async def get_status_service(
    db: DbService = Depends(get_db_service),
    redis: RedisService = Depends(get_redis_service),
    rate_limiter_redis: RedisService = Depends(get_rate_limiter_redis_service),
    xui: XuiService = Depends(get_xui_service),
) -> StatusService:
    return StatusService(db, redis, rate_limiter_redis, xui)
