import json
import logging
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from src.db import db
from src.enums import SocialNames
from src.models import Notification
from src.settings import settings

logger = logging.getLogger(__name__)

bot = Bot(token=settings.telegram.bot_token)

if not settings.telegram.bot_token:
    raise ValueError("Telegram bot token is not set")
if not settings.telegram.superuser_id:
    raise ValueError("Telegram superuser ID is not set")


async def get_notifications() -> list[Notification]:
    logger.debug("Fetching notifications from database")
    async with await db.acquire() as conn:
        rows = await conn.fetch(f"""
select distinct
       notif.id,
       social.name as social_name,
       social.login as social_login,
       profile.lang_code,
       notif.title,
       notif.content,
       notif.request_name,
       notif.request_status,
       notif.related_name,
       notif.sent_in_social,
       notif.sent_at,
       notif._inserted_dttm
from notification as notif
         inner join "user" as users on notif.user_id = users.id
         inner join profile on users.id = profile.user_id
         inner join social on users.id = social.user_id
where notif._inserted_dttm >= now() - interval '{settings.app.cleanup_period_days} days'
      and (sent_at is null or sent_in_social is null)
order by _inserted_dttm
limit 100;
        """)
        logger.debug(f"Fetched {len(rows)} rows from database")
        notifications = []
        for row in rows:
            row_dict = dict[str, Any](row)
            if isinstance(row_dict.get("title"), str):
                row_dict["title"] = json.loads(row_dict["title"])
            if isinstance(row_dict.get("content"), str):
                row_dict["content"] = json.loads(row_dict["content"])
            if isinstance(row_dict.get("id"), UUID):
                row_dict["id"] = str(row_dict["id"])
            notifications.append(Notification(**row_dict))
        logger.debug(f"Parsed {len(notifications)} notifications")
        return notifications


async def check_expiring_configs() -> None:
    logger.debug(f"Checking configs expiring in {settings.app.config_expiry_notif_hours} hours")

    async with await db.acquire() as conn:
        rows = await conn.fetch(f"""
            select distinct
                c.id as config_id,
                c.user_id,
                c.valid_to_dttm,
                c.type as config_type
            from config c
            inner join "user" u on c.user_id = u.id
            left join notification n on n.user_id = c.user_id
                and n.request_name = 'expire_config'
                and n.related_name = 'config'
                and n.related_id = c.id
            where c.valid_to_dttm between now() and now() + interval '{settings.app.config_expiry_notif_hours} hours'
                and n.id is null  -- no notification exists for this config
            order by c.valid_to_dttm;
        """)

        logger.debug(f"Found {len(rows)} configs expiring soon")

        if not rows:
            logger.debug("No configs expiring soon found")
            return

        notifications_to_insert = []
        for row in rows:
            config_id = str(row["config_id"])
            user_id = str(row["user_id"])
            valid_to_dttm: datetime = row["valid_to_dttm"]
            config_type: str = row["config_type"]

            title = {"ru": "Конфигурация скоро истечет", "en": "Config expiring soon"}
            content = {
                "ru": (
                    f"Ваша конфигурация {config_type} истечет в "
                    f"{(valid_to_dttm + timedelta(hours=3)).strftime('%d.%m.%Y %H:%M')} UTC +03:00. "
                    "Пожалуйста, продлите её."
                ),
                "en": (
                    f"Your {config_type} config expires in {valid_to_dttm.strftime('%d.%m.%Y %H:%M')} UTC +00:00. "
                    "Please renew it."
                ),
            }

            notifications_to_insert.append(
                (
                    str(uuid4()),
                    UUID(user_id),
                    "expire_config",
                    "new",
                    "config",
                    UUID(config_id),
                    json.dumps(title),
                    json.dumps(content),
                )
            )

        await conn.executemany(
            """
            INSERT INTO notification (
                id, user_id, request_name, request_status, related_name, related_id, title, content
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
            """,
            notifications_to_insert,
        )

        logger.info(f"Added {len(notifications_to_insert)} expiry config notifications")


async def send_to_telegram(notification: Notification) -> None:
    logger.debug(f"Preparing to send notification {notification.id} to Telegram user {notification.social_login}")
    title = (
        notification.title.get(notification.lang_code)
        or notification.title.get("ru")
        or list[str](notification.title.values())[0]
    )
    content = (
        notification.content.get(notification.lang_code)
        or notification.content.get("ru")
        or list[str](notification.content.values())[0]
    )
    logger.debug(f"Notification {notification.id} title: {title[:50]}..., content length: {len(content)}")

    web_app_button = InlineKeyboardButton(
        text="Открыть веб-приложение" if notification.lang_code.lower().startswith("ru") else "Open web application",
        web_app=WebAppInfo(url=str(settings.telegram.web_app_url)),
    )
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[web_app_button]])

    await bot.send_message(
        notification.social_login,
        f"<b>{title}</b>\n\n{content}",
        parse_mode="HTML",
        reply_markup=keyboard if settings.telegram.web_app_url else None,
    )
    logger.info(f"Notification {notification.id} sent to user {notification.social_login} in Telegram")


async def send_to_yandex(notification: Notification) -> None:
    raise NotImplementedError("Sending to Yandex is not implemented")


async def update_notifications(notifications_to_update: list[tuple[Notification, SocialNames]]) -> None:
    logger.debug(f"Updating {len(notifications_to_update)} notifications in database")
    to_socials: dict[SocialNames, list[str]] = {}

    for notification, sent_in_social in notifications_to_update:
        to_socials.setdefault(sent_in_social, []).append(notification.id)

    logger.debug(f"Grouped notifications by social: {[(k.value, len(v)) for k, v in to_socials.items()]}")
    for social_name, ids in to_socials.items():
        logger.debug(f"Updating {len(ids)} notifications for {social_name.value}")
        async with await db.acquire() as conn:
            await conn.execute(
                """
            update notification set sent_at = now(), sent_in_social = $1 where id::text = ANY($2::text[])
            """,
                social_name.value.lower(),
                ids,
            )
            logger.info(f"Notifications {ids} successfully sent and updated for social {social_name}")


async def send_notification(notification: Notification) -> tuple[Notification, SocialNames]:
    logger.debug(f"Processing notification {notification.id} for social {notification.social_name}")
    if notification.social_name.lower() == SocialNames.TELEGRAM.value.lower():
        await send_to_telegram(notification)
        return notification, SocialNames.TELEGRAM
    elif notification.social_name.lower() == SocialNames.YANDEX.value.lower():
        await send_to_yandex(notification)
        return notification, SocialNames.YANDEX
    else:
        logger.debug(f"Invalid social name for notification {notification.id}: {notification.social_name}")
        raise NotImplementedError(f"Invalid social name: {notification.social_name}")


async def send_notifications(notifications: list[Notification]) -> list[tuple[Notification, str]]:
    logger.debug(f"Starting to send {len(notifications)} notifications")
    failed_notifications: list[tuple[Notification, str]] = []
    notifications_to_update: list[tuple[Notification, SocialNames]] = []

    for notification in notifications:
        try:
            logger.debug(f"Sending notification {notification.id} to {notification.social_name}")
            sent_notification, sent_in_social = await send_notification(notification)
            notifications_to_update.append((sent_notification, sent_in_social))
            logger.debug(f"Notification {notification.id} sent successfully")

        except Exception as e:
            logger.error(f"Error sending notification {notification.id} to {notification.social_name}: {e}")
            logger.debug(f"Exception details for notification {notification.id}: {type(e).__name__}: {e}")
            failed_notifications.append((notification, str(e)))

    logger.debug(f"Successfully sent {len(notifications_to_update)} notifications, failed {len(failed_notifications)}")
    if notifications_to_update:
        await update_notifications(notifications_to_update)
    return failed_notifications


async def send_failed_notification(notification: Notification, error: str) -> None:
    logger.debug(f"Sending failure notification to superuser for notification {notification.id}")
    await bot.send_message(
        settings.telegram.superuser_id,
        f"<b>Notification <code>{notification.id}</code> failed</b>\n\n<code>{error}</code>",
        parse_mode="HTML",
    )
    logger.info(f"Failed notification {notification.id} sent to superuser {settings.telegram.superuser_id}")


async def send_failed_notifications(failed_notifications: list[tuple[Notification, str]]) -> None:
    logger.debug(f"Sending {len(failed_notifications)} failure notifications to superuser")
    for notification, error in failed_notifications:
        await send_failed_notification(notification, error)


async def delete_old_notifications() -> None:
    logger.debug(f"Starting cleanup of notifications older than {settings.app.cleanup_period_days} days")
    async with await db.acquire() as conn:
        result = await conn.execute(
            f"""
            delete from notification where _inserted_dttm < now() - interval '{settings.app.cleanup_period_days} days'
            """
        )
        logger.debug(f"Cleanup query executed, affected rows: {result}")


async def close_bot() -> None:
    await bot.session.close()
