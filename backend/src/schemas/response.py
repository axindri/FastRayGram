from pydantic import BaseModel


class MessageResponse(BaseModel):
    msg: str
