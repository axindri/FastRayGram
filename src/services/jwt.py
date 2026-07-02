from dataclasses import dataclass

import jwt

from src.core.settings import settings


@dataclass
class JwtService:
    secret: str
    algorithm: str

    async def encode(self, data: dict) -> str:
        return jwt.encode(data, self.secret, algorithm=self.algorithm)

    async def decode(self, token: str) -> dict:
        return jwt.decode(token, self.secret, algorithms=[self.algorithm])

    async def verify(self, token: str) -> bool:
        try:
            jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return True
        except jwt.PyJWTError:
            return False


async def get_jwt_service() -> JwtService:
    return JwtService(secret=settings.app.jwt_secret, algorithm="HS256")
