from logging import getLogger

from fastapi import Depends

from src.services.db import DbService, get_db_service
from src.services.jwt import JwtService, get_jwt_service
from src.services.notification import NotificationService, get_notification_service
from src.services.password import PasswordService, get_password_service
from src.services.session import SessionService
from src.services.token import TokenService
from src.services.user import UserService

logger = getLogger(__name__)


class AuthService:
    db: DbService
    jwt_service: JwtService
    password_service: PasswordService
    notification_service: NotificationService

    def __init__(
        self,
        db: DbService,
        jwt_service: JwtService,
        password_service: PasswordService,
        notification_service: NotificationService,
    ):
        self.db = db
        self.jwt_service = jwt_service
        self.password_service = password_service
        self.notification_service = notification_service
        self._user_service: UserService | None = None
        self._token_service: TokenService | None = None
        self._session_service: SessionService | None = None

    @property
    def user(self) -> UserService:
        if self._user_service is None:
            self._user_service = UserService(self.db, self.password_service, self.notification_service)
        return self._user_service

    @property
    def token(self) -> TokenService:
        if self._token_service is None:
            self._token_service = TokenService(self.db, self.jwt_service, self.password_service)
        return self._token_service

    @property
    def session(self) -> SessionService:
        if self._session_service is None:
            self._session_service = SessionService(self.db, self.jwt_service)
        return self._session_service


async def get_auth_service(
    db: DbService = Depends(get_db_service),
    jwt_service: JwtService = Depends(get_jwt_service),
    password_service: PasswordService = Depends(get_password_service),
    notification_service: NotificationService = Depends(get_notification_service),
) -> AuthService:
    return AuthService(db, jwt_service, password_service, notification_service)
