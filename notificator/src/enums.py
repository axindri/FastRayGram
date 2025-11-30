from enum import StrEnum, auto


class LangCodes(StrEnum):
    RU = auto()
    EN = auto()


class SocialNames(StrEnum):
    TELEGRAM = auto()
    YANDEX = auto()


class RequestNames(StrEnum):
    VERIFY = auto()
    RESET_PASSWORD = auto()
    UPDATE_CONFIG = auto()
    RENEW_CONFIG = auto()


class RequestStatuses(StrEnum):
    NEW = auto()
    APPLIED = auto()
