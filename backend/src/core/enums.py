from enum import StrEnum, auto


class AppStatuses(StrEnum):
    OK = auto()
    ERROR = auto()
    WARNING = auto()


class AppSettingsNames(StrEnum):
    BASIC = auto()
    SERVICE = auto()


class LangCodes(StrEnum):
    RU = auto()
    EN = auto()


class ConfigTypes(StrEnum):
    VLESS = auto()
    TROJAN = auto()


class UserRoles(StrEnum):
    # ! The order matters
    SUPERUSER = auto()
    ADMIN = auto()
    USER = auto()

    @classmethod
    def get_weight(cls, role: 'UserRoles') -> int:
        return list[UserRoles](cls).index(role)

    @classmethod
    def check_required_role_by_weight(cls, user_role: 'UserRoles', required_role: 'UserRoles') -> bool:
        return cls.get_weight(user_role) <= cls.get_weight(required_role)


class TokenTypes(StrEnum):
    ACCESS = auto()
    REFRESH = auto()


class SocialNames(StrEnum):
    TELEGRAM = auto()
    YANDEX = auto()


class XuiCreateClientComments(StrEnum):
    CREATED_AUTO = 'created:auto'
    CREATED_MANUALLY = 'created:manual'


class RequestNames(StrEnum):
    VERIFY = auto()
    RESET_PASSWORD = auto()
    UPDATE_CONFIG = auto()
    RENEW_CONFIG = auto()
    EXPIRE_CONFIG = auto()


class RelatedNames(StrEnum):
    USER = auto()
    CONFIG = auto()


class RequestStatuses(StrEnum):
    NEW = auto()
    APPLIED = auto()


class UserStatuses(StrEnum):
    NOT_VERIFIED = auto()
    VERIFICATION_PENDING = auto()
    VERIFIED = auto()


class ConfigStatuses(StrEnum):
    NOT_UPDATED = auto()
    UPDATE_PENDING = auto()
    UPDATED = auto()
