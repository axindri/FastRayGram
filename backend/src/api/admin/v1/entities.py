from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.models import Config, Profile, Request, Role, Session, Social, User
from src.schemas import (
    ConfigFilter,
    ConfigResponse,
    CrudSchemas,
    ProfileFilter,
    ProfileResponse,
    ProfileUpdate,
    RequestFilter,
    RequestResponse,
    RoleFilter,
    RoleResponse,
    SessionFilter,
    SessionResponse,
    SocialFilter,
    SocialResponse,
    SocialUpdate,
    UserFilter,
    UserResponse,
)
from src.utils import create_crud_router

router = APIRouter(dependencies=[Depends(required_role(UserRoles.ADMIN))])

router.include_router(
    create_crud_router(
        prefix='/users',
        tags=['users'],
        model=User,
        schemas=CrudSchemas(filter=UserFilter, response=UserResponse),
        disable_delete=True,
    )
)
router.include_router(
    create_crud_router(
        prefix='/configs',
        tags=['configs'],
        model=Config,
        schemas=CrudSchemas(filter=ConfigFilter, response=ConfigResponse),
        disable_delete=True,
    )
)

router.include_router(
    create_crud_router(
        prefix='/profiles',
        tags=['profiles'],
        model=Profile,
        schemas=CrudSchemas(filter=ProfileFilter, response=ProfileResponse, update=ProfileUpdate),
        disable_delete=True,
    )
)

router.include_router(
    create_crud_router(
        prefix='/socials',
        tags=['socials'],
        model=Social,
        schemas=CrudSchemas(filter=SocialFilter, response=SocialResponse, update=SocialUpdate),
        disable_delete=True,
    )
)

router.include_router(
    create_crud_router(
        prefix='/sessions',
        tags=['sessions'],
        model=Session,
        schemas=CrudSchemas(filter=SessionFilter, response=SessionResponse),
        disable_delete=True,
    )
)


router.include_router(
    create_crud_router(
        prefix='/requests',
        tags=['requests'],
        model=Request,
        schemas=CrudSchemas(filter=RequestFilter, response=RequestResponse),
        disable_delete=True,
    )
)

router.include_router(
    create_crud_router(
        prefix='/roles',
        tags=['roles'],
        model=Role,
        schemas=CrudSchemas(filter=RoleFilter, response=RoleResponse),
        disable_delete=True,
    )
)
