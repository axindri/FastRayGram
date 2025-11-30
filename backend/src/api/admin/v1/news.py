from fastapi import APIRouter, Depends

from src.core.enums import UserRoles
from src.dependencies import required_role
from src.models import News
from src.schemas import CrudSchemas, NewsCreate, NewsFilter, NewsResponse, NewsUpdate
from src.utils import create_crud_router

router = APIRouter(dependencies=[Depends(required_role(UserRoles.SUPERUSER))])
router.include_router(
    create_crud_router(
        prefix='/news',
        tags=['news'],
        model=News,
        schemas=CrudSchemas(
            create=NewsCreate,
            update=NewsUpdate,
            response=NewsResponse,
            filter=NewsFilter,
        ),
    )
)
