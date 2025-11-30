from datetime import datetime, timezone
from enum import StrEnum, auto
from logging import getLogger
from typing import Any

from fastapi import HTTPException, status

logger = getLogger(__name__)


class ErrorCode(StrEnum):
    UNEXPECTED_ERROR = auto()
    OBJECT_NOT_FOUND = auto()
    OBJECT_FOREIGN_KEY_ERROR = auto()
    UNIQUE_VIOLATION_ERROR = auto()
    VALIDATION_ERROR = auto()
    REGISTRATION_DISABLED_ERROR = auto()
    PERMISSION_ERROR = auto()
    RATE_LIMIT_ERROR = auto()
    NOT_AUTHORIZED_ERROR = auto()
    NOT_IMPLEMENTED_ERROR = auto()
    XUI_ERROR = auto()
    USER_NOT_VERIFIED_ERROR = auto()


class BaseAppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
        headers: dict[str, Any] | None = None,
    ):
        self.error_code = error_code
        self.context = context or {}
        self.same_http_detail_msg = same_http_detail_msg or False
        error_tag = datetime.now(timezone.utc).replace(tzinfo=None).strftime('ERRORTAG:[%d%m%Y%H%M%S]')

        self._log_error(log_msg, error_tag)

        super().__init__(
            status_code=status_code,
            detail=self._format_http_detail_message(log_msg, http_detail_msg, error_tag),
            headers=headers,
        )

    def _log_error(self, log_msg: str | None, error_tag: str) -> None:
        log_data = {
            'error_tag': error_tag,
            'context': self.context,
        }
        if log_msg:
            log_data['message'] = log_msg
            logger.error('[%s]-[message: %s]-[context: %s]', self.error_code.value, log_msg, log_data)
        else:
            logger.error('[%s]-[context: %s]', self.error_code.value, log_data)

    def _format_http_detail_message(self, log_msg: str | None, http_detail_msg: str | None, error_tag: str) -> str:
        if http_detail_msg:
            return f'{self.error_code.value}: {http_detail_msg}'
        elif log_msg and self.same_http_detail_msg:
            return f'{self.error_code.value}: {log_msg}'
        return f'{self.error_code.value}: {error_tag}'


class UnexpectedError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code=ErrorCode.UNEXPECTED_ERROR,
            log_msg=log_msg,
            http_detail_msg=http_detail_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class ObjectNotFoundError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        object_name: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        context = context or {}
        if object_name:
            context['object_name'] = object_name

        if not log_msg and object_name:
            log_msg = f'{object_name} not found'
        elif not log_msg:
            log_msg = 'Object not found'

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.OBJECT_NOT_FOUND,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class ObjectForeignKeyError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        object_name: str | None = None,
        foreign_key: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        context = context or {}
        if object_name:
            context['object_name'] = object_name
        if foreign_key:
            context['foreign_key'] = foreign_key

        if not log_msg and object_name:
            log_msg = f'{object_name} foreign key constraint violation'

        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.OBJECT_FOREIGN_KEY_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class ObjectUniqueViolationError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        object_name: str | None = None,
        field_name: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        context = context or {}
        if object_name:
            context['object_name'] = object_name
        if field_name:
            context['field_name'] = field_name

        if log_msg and object_name and field_name:
            log_msg = f'{object_name} with {field_name} {log_msg}'
        elif log_msg and object_name:
            log_msg = f'{object_name} {log_msg}'
        elif not log_msg and object_name and field_name:
            log_msg = f'{object_name} with {field_name} already exists'
        elif not log_msg and object_name:
            log_msg = f'{object_name} unique constraint violation'

        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.UNIQUE_VIOLATION_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class ValidationError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=ErrorCode.VALIDATION_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class PermissionError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.PERMISSION_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class RegistrationDisabledError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.REGISTRATION_DISABLED_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class RateLimitError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
        headers: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code=ErrorCode.RATE_LIMIT_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
            headers=headers,
        )


class NotAuthorizedError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.NOT_AUTHORIZED_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class NotImplementedError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            error_code=ErrorCode.NOT_IMPLEMENTED_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class XuiError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=ErrorCode.XUI_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )


class UserNotVerifiedError(BaseAppException):
    def __init__(
        self,
        log_msg: str | None = None,
        http_detail_msg: str | None = None,
        same_http_detail_msg: bool | None = None,
        context: dict[str, Any] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.USER_NOT_VERIFIED_ERROR,
            http_detail_msg=http_detail_msg,
            log_msg=log_msg,
            same_http_detail_msg=same_http_detail_msg,
            context=context,
        )
