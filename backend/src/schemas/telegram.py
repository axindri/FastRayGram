from pydantic import BaseModel


class TelegramUserLogin(BaseModel):
    id: int
    first_name: str
    last_name: str | None = None
    username: str
    language_code: str
    init_data_str: str
