from logging import getLogger

from src.core.enums import AppSettingsNames, LangCodes, UserRoles, UserStatuses
from src.core.settings import settings
from src.db import database
from src.db.redis import redis_db, redis_limiter_db
from src.models import AppSettings as AppSettingsModel
from src.models import Profile as ProfileModel
from src.models import Role as RoleModel
from src.models import User as UserModel
from src.schemas import (
    AppSettingsCreate,
    BasicSettings,
    ProfileCreate,
    ProfileInRegisterForm,
    RegisterForm,
    RoleCreate,
    ServiceSettings,
    UserRegisterForm,
)
from src.services.db import DbService
from src.services.password import PasswordService

logger = getLogger(__name__)


async def create_settings() -> bool:
    try:
        async for session in database.session_dependency():
            db = DbService(session)
            async with db.transaction() as tx:
                if await tx.db.get(AppSettingsModel, {'name': AppSettingsNames.BASIC}) or await tx.db.get(
                    AppSettingsModel, {'name': AppSettingsNames.SERVICE}
                ):
                    logger.info('Settings already created!')
                    break
                basic_settings = BasicSettings(
                    disable_registration=settings.app.disable_registration_startup_param,
                )
                logger.info('Create basic settings: %s', basic_settings)
                await tx.db.create(
                    AppSettingsModel,
                    AppSettingsCreate(
                        name=AppSettingsNames.BASIC,
                        values=basic_settings.model_dump(),
                    ).model_dump(),
                )
                service_settings = ServiceSettings(
                    max_limit_ip=settings.app.max_limit_ip_startup_param,
                    max_total_gb=settings.app.max_total_gb_startup_param,
                )
                logger.info('Create service settings: %s', service_settings)
                await tx.db.create(
                    AppSettingsModel,
                    AppSettingsCreate(
                        name=AppSettingsNames.SERVICE,
                        values=service_settings.model_dump(),
                    ).model_dump(),
                )
            return True
    except Exception as e:
        logger.error(f'Cant create settings, because: {e}')
        return False


async def create_roles() -> bool:
    try:
        async for session in database.session_dependency():
            db = DbService(session)
            async with db.transaction() as tx:
                user_roles: list[UserRoles] = list[UserRoles](UserRoles)
                for role in user_roles:
                    if not await tx.db.get(RoleModel, {'name': role.value}):
                        logger.info('Create new role: %s ', role.value)
                        await tx.db.create(
                            RoleModel,
                            RoleCreate(
                                name=role.value,
                                weight=UserRoles.get_weight(role),
                            ).model_dump(),
                        )
            break
        return True
    except Exception as e:
        logger.error(f'Cant create roles, because: {e}')
        return False


async def create_superuser() -> bool:
    try:
        async for session in database.session_dependency():
            db = DbService(session)
            async with db.transaction() as tx:
                register_form = RegisterForm(
                    user=UserRegisterForm(login=settings.app.superuser_login, password=settings.app.superuser_password),
                    profile=ProfileInRegisterForm(first_name='Super', last_name='User', lang_code=LangCodes.RU),
                )

                if await tx.db.get(UserModel, {'login': register_form.user.login}):
                    logger.info('Superuser %s already created!', register_form.user.login)
                    break

                role_user = await tx.db.get_or_raise(RoleModel, filter={'name': UserRoles.SUPERUSER})
                user_data = register_form.user.model_dump()
                user_data.update(
                    {
                        'role_id': role_user.id,
                        'status': UserStatuses.VERIFIED.value,
                        'password': PasswordService(settings.app.salt).generate(register_form.user.password),
                    }
                )
                logger.info('Create superuser: %s', register_form.user.login)
                user = await tx.db.create(UserModel, user_data)
                await tx.db.create(
                    ProfileModel,
                    ProfileCreate(
                        **register_form.profile.model_dump(),
                        user_id=user.id,
                    ).model_dump(),
                )

            break
        return True
    except Exception as e:
        logger.error(f'Cant create superuser, because: {e}')
        return False


async def init_redis() -> None:
    try:
        await redis_db.initialize()
        await redis_limiter_db.initialize()
        logger.info('Redis connections initialized successfully')
    except Exception as e:
        logger.error(f'Failed to initialize Redis connections: {e}')
        raise


async def close_redis() -> None:
    try:
        await redis_db.close()
        await redis_limiter_db.close()
        logger.info('Redis connections closed successfully')
    except Exception as e:
        logger.error(f'Error closing Redis connections: {e}')


async def init_db() -> None:
    try:
        await database.db_init()
        logger.info('Database connection initialized successfully')
    except Exception as e:
        logger.error(f'Failed to initialize Database connection: {e}')
        raise


async def close_db() -> None:
    try:
        await database.db_close()
        logger.info('Database connection closed successfully')
    except Exception as e:
        logger.error(f'Error closing Database connection: {e}')
