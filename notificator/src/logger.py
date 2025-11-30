import logging
from logging import config as logging_config

LOG_FORMAT = "[%(asctime)s]-[%(name)s]-[%(levelname)s]: %(message)s"
LOG_DEFAULT_HANDLERS = [
    "console",
]


def setup_logging(debug: bool) -> None:
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {"format": LOG_FORMAT},
        },
        "handlers": {
            "console": {
                "level": "DEBUG",
                "class": "logging.StreamHandler",
                "formatter": "verbose",
            },
        },
        "loggers": {
            "": {
                "handlers": LOG_DEFAULT_HANDLERS,
                "level": "INFO",
            },
        },
        "root": {
            "level": "DEBUG" if debug else "INFO",
            "formatter": "verbose",
            "handlers": LOG_DEFAULT_HANDLERS,
        },
    }
    logging_config.dictConfig(config)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
