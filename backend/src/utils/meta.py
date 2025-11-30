from fastapi import Request

from src.core.enums import SocialNames


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()

    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip.strip()

    cf_ip = request.headers.get('CF-Connecting-IP')
    if cf_ip:
        return cf_ip.strip()

    if request.client:
        return request.client.host

    return 'unknown'


def get_device_info(user_agent: str | None) -> str:
    if not user_agent:
        return 'Unknown Device'

    if 'Android' in user_agent:
        return 'Android'
    elif 'iPhone' in user_agent:
        return 'iPhone'
    elif 'Mobile' in user_agent:
        return 'Mobile Device'
    elif 'Windows' in user_agent:
        return 'Windows PC'
    elif 'Mac' in user_agent:
        return 'Mac'
    elif 'Linux' in user_agent:
        return 'Linux PC'
    else:
        return 'Unknown Device'


def get_session_name(user_agent: str | SocialNames | None) -> str:
    if not user_agent:
        return 'Web Browser'

    if 'Chrome' in user_agent:
        return 'Chrome Browser'
    elif 'Firefox' in user_agent:
        return 'Firefox Browser'
    elif 'Safari' in user_agent:
        return 'Safari Browser'
    elif 'Edge' in user_agent:
        return 'Edge Browser'
    if isinstance(user_agent, SocialNames):
        return user_agent.value.capitalize()
    else:
        return 'Web Browser'
