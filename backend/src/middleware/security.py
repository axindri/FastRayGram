from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.core.settings import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore
        response: Response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        is_docs_page = any(
            request.url.path.startswith(path) for path in [settings.app.docs_path, settings.app.openapi_path]
        )

        content_type = response.headers.get('content-type', '')
        is_html = 'text/html' in content_type or is_docs_page

        if is_html:
            if is_docs_page:
                response.headers['Content-Security-Policy'] = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self'"
                )
                response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            else:
                response.headers['Content-Security-Policy'] = "default-src 'self'"
                response.headers['X-Frame-Options'] = 'DENY'

        if not settings.app.debug and request.url.scheme == 'https':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        return response
