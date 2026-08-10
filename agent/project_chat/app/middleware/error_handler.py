
import traceback
import uuid
from typing import Callable, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

from core.exceptions import (
    AgentBaseException,
    ConfigurationError,
    DatabaseError,
    AuthenticationError,
    AuthorizationError,
    LLMError,
    ProjectNotFoundError,
    UserNotFoundError,
    ChatHistoryError,
    ValidationError,
    ExternalServiceError,
    RateLimitError,
    TimeoutError
)


logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware:
    """グローバルエラーハンドラーミドルウェア"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope: dict, receive: Callable, send: Callable):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        try:
            await self.app(scope, receive, send)
        except Exception as exc:
            await self._handle_exception(scope, receive, send, exc)
    
    async def _handle_exception(
        self, 
        scope: dict, 
        receive: Callable, 
        send: Callable, 
        exc: Exception
    ):
        """例外を処理し、適切なレスポンスを返す"""
        
        error_id = str(uuid.uuid4())
        request = Request(scope, receive)
        
        # エラーをログに記録
        self._log_error(exc, error_id, request)
        
        # 例外タイプに基づいてレスポンスを決定
        response_data = self._create_error_response(exc, error_id)
        status_code = self._get_status_code(exc)
        
        response = JSONResponse(
            content=response_data,
            status_code=status_code
        )
        
        await response(scope, receive, send)
    
    def _log_error(self, exc: Exception, error_id: str, request: Request):
        """構造化情報でエラーをログに記録"""
        
        error_info = {
            "error_id": error_id,
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "path": request.url.path,
            "method": request.method,
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }
        
        # カスタム例外の追加コンテキストを追加
        if isinstance(exc, AgentBaseException):
            error_info.update({
                "error_code": exc.error_code,
                "details": exc.details,
            })
        
        # サーバーエラーのスタックトレースを追加
        if isinstance(exc, (ConfigurationError, DatabaseError, LLMError, ExternalServiceError)):
            error_info["traceback"] = traceback.format_exc()
        
        # 適切なレベルでログに記録
        if isinstance(exc, (AuthenticationError, AuthorizationError, ValidationError)):
            logger.warning("Client error occurred", extra=error_info)
        elif isinstance(exc, (RateLimitError, TimeoutError)):
            logger.warning("Rate limit or timeout error", extra=error_info)
        else:
            logger.error("Server error occurred", extra=error_info)
    
    def _create_error_response(self, exc: Exception, error_id: str) -> Dict[str, Any]:
        """標準化されたエラーレスポンスを作成"""
        
        response = {
            "error": {
                "id": error_id,
                "type": type(exc).__name__,
                "message": str(exc),
            }
        }
        
        # カスタム例外の特定フィールドを追加
        if isinstance(exc, AgentBaseException):
            if exc.error_code:
                response["error"]["code"] = exc.error_code
            if exc.details:
                response["error"]["details"] = exc.details
        
        # 一般的なエラーのユーザーフレンドリーなメッセージを追加
        if isinstance(exc, AuthenticationError):
            response["error"]["message"] = "Authentication failed"
        elif isinstance(exc, AuthorizationError):
            response["error"]["message"] = "Access denied"
        elif isinstance(exc, ProjectNotFoundError):
            response["error"]["message"] = "Project not found"
        elif isinstance(exc, UserNotFoundError):
            response["error"]["message"] = "User not found"
        elif isinstance(exc, ValidationError):
            response["error"]["message"] = "Invalid input data"
        elif isinstance(exc, RateLimitError):
            response["error"]["message"] = "Rate limit exceeded"
        elif isinstance(exc, TimeoutError):
            response["error"]["message"] = "Request timeout"
        
        return response
    
    def _get_status_code(self, exc: Exception) -> int:
        """例外に適切なHTTPステータスコードを取得"""
        
        if isinstance(exc, AuthenticationError):
            return status.HTTP_401_UNAUTHORIZED
        elif isinstance(exc, AuthorizationError):
            return status.HTTP_403_FORBIDDEN
        elif isinstance(exc, (ProjectNotFoundError, UserNotFoundError)):
            return status.HTTP_404_NOT_FOUND
        elif isinstance(exc, ValidationError):
            return status.HTTP_422_UNPROCESSABLE_ENTITY
        elif isinstance(exc, RateLimitError):
            return status.HTTP_429_TOO_MANY_REQUESTS
        elif isinstance(exc, TimeoutError):
            return status.HTTP_408_REQUEST_TIMEOUT
        elif isinstance(exc, HTTPException):
            return exc.status_code
        elif isinstance(exc, StarletteHTTPException):
            return exc.status_code
        elif isinstance(exc, RequestValidationError):
            return status.HTTP_422_UNPROCESSABLE_ENTITY
        else:
            return status.HTTP_500_INTERNAL_SERVER_ERROR


def setup_error_handlers(app):
    """FastAPIアプリケーションのエラーハンドラーをセットアップ"""
    
    # カスタム例外ハンドラーを追加
    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(request: Request, exc: AuthenticationError):
        error_id = str(uuid.uuid4())
        logger.warning(f"Authentication error: {exc.message}", extra={
            "error_id": error_id,
            "error_code": exc.error_code,
            "path": request.url.path,
        })
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": {
                    "id": error_id,
                    "type": "AuthenticationError",
                    "message": "Authentication failed",
                    "code": exc.error_code,
                }
            }
        )
    
    @app.exception_handler(AuthorizationError)
    async def authorization_error_handler(request: Request, exc: AuthorizationError):
        error_id = str(uuid.uuid4())
        logger.warning(f"Authorization error: {exc.message}", extra={
            "error_id": error_id,
            "error_code": exc.error_code,
            "path": request.url.path,
        })
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": {
                    "id": error_id,
                    "type": "AuthorizationError",
                    "message": "Access denied",
                    "code": exc.error_code,
                }
            }
        )
    
    @app.exception_handler(ProjectNotFoundError)
    async def project_not_found_handler(request: Request, exc: ProjectNotFoundError):
        error_id = str(uuid.uuid4())
        logger.info(f"Project not found: {exc.message}", extra={
            "error_id": error_id,
            "path": request.url.path,
        })
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": {
                    "id": error_id,
                    "type": "ProjectNotFoundError",
                    "message": "Project not found",
                }
            }
        )
    
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        error_id = str(uuid.uuid4())
        logger.info(f"Validation error: {exc.message}", extra={
            "error_id": error_id,
            "details": exc.details,
            "path": request.url.path,
        })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "id": error_id,
                    "type": "ValidationError",
                    "message": "Invalid input data",
                    "details": exc.details,
                }
            }
        )
    
    @app.exception_handler(DatabaseError)
    async def database_error_handler(request: Request, exc: DatabaseError):
        error_id = str(uuid.uuid4())
        logger.error(f"Database error: {exc.message}", extra={
            "error_id": error_id,
            "error_code": exc.error_code,
            "path": request.url.path,
        })
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "id": error_id,
                    "type": "DatabaseError",
                    "message": "Database operation failed",
                    "code": exc.error_code,
                }
            }
        )
    
    @app.exception_handler(LLMError)
    async def llm_error_handler(request: Request, exc: LLMError):
        error_id = str(uuid.uuid4())
        logger.error(f"LLM error: {exc.message}", extra={
            "error_id": error_id,
            "error_code": exc.error_code,
            "path": request.url.path,
        })
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "id": error_id,
                    "type": "LLMError",
                    "message": "AI service temporarily unavailable",
                    "code": exc.error_code,
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        error_id = str(uuid.uuid4())
        logger.error(f"Unexpected error: {str(exc)}", extra={
            "error_id": error_id,
            "error_type": type(exc).__name__,
            "path": request.url.path,
            "traceback": traceback.format_exc(),
        })
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "id": error_id,
                    "type": "InternalServerError",
                    "message": "An unexpected error occurred",
                }
            }
        )

