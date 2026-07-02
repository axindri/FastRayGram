import logging

from src.core.settings import settings

LOGGER_NAME = "app"
LOG_FORMAT = "[%(asctime)s]-[%(name)s]-[%(levelname)s]: %(message)s"


def get_logger(name: str = LOGGER_NAME) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if settings.app.debug else logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(handler)

    logger.propagate = False
    return logger


logger = get_logger()
