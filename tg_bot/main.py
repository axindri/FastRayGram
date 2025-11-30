import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from settings import settings

logger = logging.getLogger(__name__)


async def on_start(message: Message) -> None:
    user = message.from_user
    if user:
        logger.info(f"Received /start command from user {user.id} (@{user.username})")
    else:
        logger.warning("Received /start command from unknown user")

    is_russian = False
    if user and user.language_code:
        is_russian = user.language_code.lower().startswith("ru")

    if is_russian:
        welcome_text = "Привет! Нажми кнопку, чтобы открыть веб-приложение."
        button_text = "Открыть веб-приложение"
    else:
        welcome_text = "Hello! Click the button to open the web application."
        button_text = "Open Web App"

    web_app_button = InlineKeyboardButton(text=button_text, web_app=WebAppInfo(url=str(settings.web_app_url)))
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[web_app_button]])
    await message.answer(welcome_text, reply_markup=keyboard)

    if user:
        logger.debug(f"Sent welcome message to user {user.id} (language: {user.language_code})")


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    logger.info("Starting bot...")
    bot = Bot(token=settings.bot_token)
    dp = Dispatcher()

    dp.message.register(on_start, CommandStart())

    logger.info("Deleting webhook and dropping pending updates...")
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("Starting polling...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
