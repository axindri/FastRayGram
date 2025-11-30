from dataclasses import dataclass
from logging import getLogger
from typing import Any

from fastapi import Depends

from src.models import AppSettings
from src.schemas import AppSettingsJsonResponse, AppSettingsJsonUpdate
from src.services.db import DbService, get_db_service

logger = getLogger(__name__)


@dataclass
class AppService:
    db: DbService

    async def get_settings(self) -> AppSettingsJsonResponse:
        async with self.db.transaction() as tx:
            app_settings = await tx.db.get_all(AppSettings)

            app_settings_json: dict[str, Any] = {}
            for setting in app_settings:
                app_settings_json[setting.name] = setting.values

            return AppSettingsJsonResponse.model_validate(app_settings_json)

    async def update_settings(self, settings_update: AppSettingsJsonUpdate) -> AppSettingsJsonResponse:
        async with self.db.transaction() as tx:
            for name, value in settings_update.model_dump(exclude_unset=True).items():
                logger.debug('Update setting %s with value %s', name, value)
                app_setting = await tx.db.get_or_raise(AppSettings, filter={'name': name})
                await tx.db.update(AppSettings, app_setting.id, {'values': value})

        return await self.get_settings()


async def get_app_service(db_service: DbService = Depends(get_db_service)) -> AppService:
    return AppService(db_service)
