from pydantic import BaseModel

from src.schemas.profile import ProfileInRegisterForm, ProfileInRegisterSocialForm
from src.schemas.user import UserRegisterForm, UserRegisterSocialForm


class RegisterForm(BaseModel):
    user: UserRegisterForm
    profile: ProfileInRegisterForm


class RegisterSocialForm(BaseModel):
    user: UserRegisterSocialForm
    profile: ProfileInRegisterSocialForm


class LoginForm(BaseModel):
    login: str
    password: str
