from dataclasses import dataclass
from logging import getLogger

from passlib.hash import pbkdf2_sha256

from src.core.settings import settings

logger = getLogger(__name__)


@dataclass
class PasswordService:
    salt: str

    def generate(self, plain_password: str) -> str:
        logger.debug('Generate new password')
        return str(pbkdf2_sha256.hash(plain_password + self.salt))

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        verify = bool(pbkdf2_sha256.verify(plain_password + self.salt, hashed_password))
        logger.debug('Validated plain password: %s', verify)
        return verify


async def get_password_service() -> PasswordService:
    return PasswordService(settings.app.salt)
