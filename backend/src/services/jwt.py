from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from logging import getLogger
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException
from jose import jwt
from jose.exceptions import JWTError
from pydantic import ValidationError

from src.core.enums import TokenTypes
from src.core.exceptions import NotAuthorizedError, UnexpectedError
from src.core.exceptions import ValidationError as CustomValidationError
from src.core.settings import settings
from src.schemas import SessionDataInToken, UserInToken
from src.services.redis import RedisService, get_redis_service

logger = getLogger(__name__)


@dataclass
class JwtService:
    redis: RedisService
    jwt_master_key: str
    jwt_algorithm: str
    access_token_expire_sec: int
    refresh_token_expire_sec: int

    @staticmethod
    def _check_token_data_headers_or_raise(decode_data: dict[str, Any]) -> bool:
        if 'exp' not in decode_data.keys():
            raise NotAuthorizedError('No exp key in token data', 'Bad token headers')

        if 'iat' not in decode_data.keys():
            raise NotAuthorizedError('No iat key in token data', 'Bad token headers')

        if 'sub' not in decode_data.keys():
            raise NotAuthorizedError('No sub key in token data', 'Bad token headers')

        if 'type' not in decode_data.keys():
            raise NotAuthorizedError('No type key in token data', 'Bad token headers')

        if 'data' not in decode_data.keys():
            raise NotAuthorizedError('No data key in token data', 'Bad token headers')

        return True

    @staticmethod
    def _make_redis_token_key(sub: str, token: str, delimiter: str = ':') -> str:
        return sub + delimiter + token

    def _decode_token_or_raise(self, token: str) -> dict[str, Any]:
        decoded = jwt.decode(token, self.jwt_master_key, algorithms=self.jwt_algorithm)
        logger.debug('Successfully decode token: %s', token)
        return decoded

    async def make_token(self, data: dict[str, Any], expire_sec: int) -> str:
        to_encode_data = data.copy()
        to_encode_data.update({'iat': datetime.now(timezone.utc)})

        if 'exp' not in data.keys():
            to_encode_data.update(
                {'exp': int((datetime.now(timezone.utc) + timedelta(seconds=expire_sec)).timestamp())}
            )

        self._check_token_data_headers_or_raise(to_encode_data)
        token = jwt.encode(to_encode_data, self.jwt_master_key, algorithm=self.jwt_algorithm)

        return token

    async def revoke_access_token(self, sub: str, token: str) -> bool:
        await self.redis.delete(self._make_redis_token_key(sub, token))
        logger.debug('Successfully revoke access token: %s', token)
        return True

    async def revoke_refresh_token(self, sub: str, token: str) -> bool:
        await self.redis.delete(self._make_redis_token_key(sub, token))
        logger.debug('Successfully revoke refresh token: %s', token)
        return True

    async def revoke_all_access_tokens(
        self, sub: str, exclude_current: bool | None = None, token: str | None = None
    ) -> bool:
        await self.redis.delete_by_pattern(
            self._make_redis_token_key(sub, '*'),
            exclude_key=self._make_redis_token_key(sub, token) if exclude_current else None,
        )
        logger.debug('Successfully revoke all access tokens for subject: %s', sub)
        return True

    async def create_access_token(self, token: str, sub: str) -> str:
        redis_key = self._make_redis_token_key(sub, token)
        if not await self.redis.set_with_ttl(
            redis_key,
            settings.auth.access_token_expire_sec,
            settings.auth.access_token_redis_ttl_sec,
        ):
            raise NotAuthorizedError(f'Failed to set access token: {redis_key} to redis', 'Failed to save access token')
        logger.debug('Successfully create access token: %s', token)
        return token

    async def create_refresh_token(self, token: str, sub: str) -> str:
        redis_key = self._make_redis_token_key(sub, token)
        if not await self.redis.set_with_ttl(
            redis_key,
            settings.auth.refresh_token_expire_sec,
            settings.auth.refresh_token_redis_ttl_sec,
        ):
            raise NotAuthorizedError(
                f'Failed to set refresh token: {redis_key} to redis', 'Failed to save refresh token'
            )

        logger.debug('Successfully create refresh token: %s', token)
        return token

    async def validate_token(self, token: str) -> dict[str, Any]:
        data = self._decode_token_or_raise(token)
        self._check_token_data_headers_or_raise(data)

        redis_key = self._make_redis_token_key(data['sub'], token)
        if not await self.redis.verify(redis_key):
            raise NotAuthorizedError(f'No token in redis: {token}', 'Unknown token')

        logger.debug('Successfully validate token')
        return data

    async def validate_access_token(self, token: str) -> UserInToken:
        try:
            payload = await self.validate_token(token)

            data: dict[str, Any] = payload['data']
            data['id'] = UUID(payload['sub'])

            user_in_token = UserInToken.model_validate(data)

        except HTTPException:
            raise

        except ValidationError as e:
            raise CustomValidationError(f'Access token validation error: {str(e)}', 'Invalid token data')

        except JWTError as e:
            raise NotAuthorizedError(f' Other access token JWT error: {str(e)}', 'Invalid token')

        except Exception as e:
            raise UnexpectedError(f'Other access token error: {str(e)}', 'Invalid token')

        if payload['type'] != TokenTypes.ACCESS:
            raise NotAuthorizedError('Only access token is allowed to use', same_http_detail_msg=True)

        return user_in_token

    async def validate_refresh_token(self, token: str) -> SessionDataInToken:
        try:
            payload = await self.validate_token(token)
            data = payload['data']
            session_in_token = SessionDataInToken.model_validate(data)

        except HTTPException:
            raise

        except JWTError as e:
            raise NotAuthorizedError(f'Other refresh token JWT error: {str(e)}', 'Invalid refresh token')

        except ValidationError as e:
            raise CustomValidationError(f'Refresh token validation error: {str(e)}', 'Invalid refresh token data')

        except Exception as e:
            raise UnexpectedError(f'Other refresh token error: {str(e)}', 'Invalid refresh token')

        if payload['type'] != TokenTypes.REFRESH:
            raise NotAuthorizedError('Only refresh token is allowed to use', same_http_detail_msg=True)

        return session_in_token


async def get_jwt_service(redis: RedisService = Depends(get_redis_service)) -> JwtService:
    return JwtService(
        redis,
        settings.auth.jwt_master_key,
        settings.auth.jwt_algorithm,
        settings.auth.access_token_expire_sec,
        settings.auth.refresh_token_expire_sec,
    )
