import re
from typing import Annotated

from pydantic import AfterValidator, Field

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9]+$")
USERNAME_MAX_LENGTH = 32


def normalize_username(value: str) -> str:
    normalized = value.strip()
    if not USERNAME_PATTERN.fullmatch(normalized):
        raise ValueError("Username must contain only English letters and digits")
    return normalized


Username = Annotated[str, Field(min_length=1, max_length=USERNAME_MAX_LENGTH), AfterValidator(normalize_username)]

MARK_MAX_LENGTH = 64


def normalize_mark(value: str) -> str:
    return value.strip()


OptionalMark = Annotated[str, Field(default="", max_length=MARK_MAX_LENGTH), AfterValidator(normalize_mark)]
RequiredMark = Annotated[str, Field(min_length=1, max_length=MARK_MAX_LENGTH), AfterValidator(normalize_mark)]
