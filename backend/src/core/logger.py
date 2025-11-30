from logging import config as logging_config

LOG_FORMAT = '[%(asctime)s]-[%(name)s]-[%(levelname)s]: %(message)s'
LOG_DEFAULT_HANDLERS = [
    'console',
]


def setup_logging(debug: bool) -> None:
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {'format': LOG_FORMAT},
            'default': {
                '()': 'uvicorn.logging.DefaultFormatter',
                'fmt': '[%(asctime)s]-[%(name)s]-[%(levelname)s]: %(message)s',
                'use_colors': None,
            },
            'access': {
                '()': 'uvicorn.logging.AccessFormatter',
                'fmt': "[%(asctime)s]-[%(name)s]-[%(levelname)s]: %(client_addr)s - '%(request_line)s' %(status_code)s",
            },
        },
        'handlers': {
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
            'default': {
                'formatter': 'default',
                'class': 'logging.StreamHandler',
                'stream': 'ext://sys.stdout',
            },
            'access': {
                'formatter': 'access',
                'class': 'logging.StreamHandler',
                'stream': 'ext://sys.stdout',
            },
        },
        'loggers': {
            '': {
                'handlers': LOG_DEFAULT_HANDLERS,
                'level': 'INFO',
            },
            'uvicorn.error': {
                'level': 'INFO',
            },
            'uvicorn.access': {
                'handlers': ['access'],
                'level': 'INFO',
                'propagate': False,
            },
            'httpx': {
                'level': 'INFO',
            },
            'httpcore': {
                'level': 'INFO',
            },
        },
        'root': {
            'level': 'DEBUG' if debug else 'INFO',
            'formatter': 'verbose',
            'handlers': LOG_DEFAULT_HANDLERS,
        },
    }
    logging_config.dictConfig(config)
