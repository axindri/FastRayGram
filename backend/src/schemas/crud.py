from dataclasses import dataclass
from typing import Type

from pydantic import BaseModel


@dataclass
class CrudSchemas:
    create: Type[BaseModel] | None = None
    update: Type[BaseModel] | None = None
    response: Type[BaseModel] | None = None
    filter: Type[BaseModel] | None = None
