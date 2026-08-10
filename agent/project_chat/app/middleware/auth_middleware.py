from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Callable
from services.auth_service import AuthorizationService
from core.exceptions import AuthenticationError
from core.logging import get_logger
from core.config import get_config

logger = get_logger("auth_middleware")


class AuthMiddleware:
    def __init__(self, app):
        self.app = app
        self.config = get_config()

    async def __call__(self, scope: dict, receive: Callable, send: Callable):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        # Skip authentication for certain endpoints
        if self._should_skip_auth(request.url.path):
            await self.app(scope, receive, send)
            return

        # Authorizationヘッダーを取得
        headers = dict(request.headers)
        auth_service = AuthorizationService()
        
        try:
            # JWTトークンを検証
            payload = auth_service.authenticate_request(headers)
            
            if payload is None:
                logger.warning("Authentication failed: No valid token")
                response = JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid or missing authentication token"}
                )
                await response(scope, receive, send)
                return
                
        except AuthenticationError as e:
            logger.warning(f"Authentication error: {e.message}")
            response = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": e.message}
            )
            await response(scope, receive, send)
            return

        # 認証成功時は、ユーザー情報をリクエストに追加
        scope["user"] = payload
        
        await self.app(scope, receive, send)
    
    def _should_skip_auth(self, path: str) -> bool:
        """Determine if authentication should be skipped for this path"""
        
        # Always skip authentication for these endpoints
        public_endpoints = [
            "/health",
            "/",
            "/openapi.json"
        ]
        
        # Skip authentication for documentation endpoints in development
        if self.config.is_development:
            public_endpoints.extend([
                "/docs",
                "/redoc",
                "/api/v1/docs/health",
                "/api/v1/docs/chat", 
                "/api/v1/docs/rate-limits"
            ])
        
        # Check if path matches any public endpoint
        for endpoint in public_endpoints:
            if path == endpoint:
                return True
        
        # Check for API v1 health endpoints
        if path.startswith("/api/v1/health"):
            return True
            
        return False


def get_current_user(request: Request) -> dict:
    """
    現在のユーザー情報を取得するヘルパー関数
    """
    user = request.scope.get("user")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    return user
