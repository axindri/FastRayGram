from logging import getLogger

from src.core.enums import UserRoles
from src.core.exceptions import PermissionError

logger = getLogger(__name__)


def check_required_role(user_role: UserRoles, required_role: UserRoles) -> None:
    if not UserRoles.check_required_role_by_weight(UserRoles(user_role), required_role):
        raise PermissionError(
            f"User with role: '{user_role}' does not have permission to access this endpoint",
            'Not enough previliges',
        )
    logger.debug('Permission granted for user: %s', user_role)


def get_required_role_doc(required_role: UserRoles) -> str:
    return f'Requires role: {required_role}'
