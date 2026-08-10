
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from core.logging import get_logger

logger = get_logger("security_middleware")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """すべてのレスポンスにセキュリティヘッダーを追加"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Check if this is a documentation endpoint
        is_docs_endpoint = self._is_documentation_endpoint(request.url.path)
        
        # セキュリティヘッダー
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Set frame options based on endpoint type
        if is_docs_endpoint:
            # Allow framing for documentation (Swagger UI needs this)
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
        else:
            # Deny framing for other endpoints
            response.headers["X-Frame-Options"] = "DENY"
        
        # Set Content Security Policy based on endpoint type
        if is_docs_endpoint:
            # More permissive CSP for documentation endpoints
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https: blob:; "
                "font-src 'self' data: https://cdn.jsdelivr.net; "
                "connect-src 'self' https:; "
                "frame-ancestors 'self';"
            )
        else:
            # Restrictive CSP for other endpoints
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none';"
            )
        
        response.headers["Content-Security-Policy"] = csp
        
        # サーバー情報を削除
        if "server" in response.headers:
            del response.headers["server"]
        
        return response
    
    def _is_documentation_endpoint(self, path: str) -> bool:
        """Check if the path is a documentation endpoint"""
        docs_paths = [
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/api/v1/docs/"
        ]
        
        for docs_path in docs_paths:
            if path.startswith(docs_path):
                return True
        
        return False

