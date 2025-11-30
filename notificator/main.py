import asyncio
import logging
import signal
import sys

from src.db import db
from src.logger import setup_logging
from src.service import (
    check_expiring_configs,
    close_bot,
    delete_old_notifications,
    get_notifications,
    send_failed_notifications,
    send_notifications,
)
from src.settings import settings

logger = logging.getLogger(__name__)

running = True


def signal_handler(signum, frame):
    global running
    logger.info(f"Received signal {signum}, shutting down...")
    running = False


async def process_notifications():
    try:
        logger.debug("Checking for expiring configs")
        await check_expiring_configs()

        notifications = await get_notifications()

        if not notifications:
            logger.info("No notifications to send")
            await delete_old_notifications()
            return

        logger.info(f"Got {len(notifications)} notifications to send")
        failed_notifications = await send_notifications(notifications)

        await send_failed_notifications(failed_notifications)
        logger.info(f"Sent {len(notifications) - len(failed_notifications)} notifications")
        logger.info(f"Failed to send {len(failed_notifications)} notifications")

        await delete_old_notifications()

    except Exception as e:
        logger.error(f"Error processing notifications: {e}")


async def main():
    setup_logging(settings.app.debug)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        await db.connect()
        await db.test_connection()
        logger.info(f"Running with app settings: {settings.app}")
        logger.info(f"Starting notification scheduler (every {settings.app.process_period_sec} seconds)")

        while running:
            await process_notifications()

            if running:
                logger.debug(f"Waiting {settings.app.process_period_sec} seconds before next check...")
                await asyncio.sleep(settings.app.process_period_sec)

    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        logger.info("Shutting down...")
        await db.close()
        await close_bot()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(0)
