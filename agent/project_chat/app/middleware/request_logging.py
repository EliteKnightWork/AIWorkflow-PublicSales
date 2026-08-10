"""
リクエストログミドルウェア
相関IDを使用した包括的なリクエスト/レスポンスログ
"""

import time
import uuid
import json
from typing import Dict, Any, Optional, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import logging

from core.logging import get_logger

logger = get_logger("request_logging")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """相関IDを使用したリクエストログミドルウェア"""
    
    def __init__(self, app, log_requests: bool = True, log_responses: bool = True, log_body: bool = False):
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
        self.log_body = log_body
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """包括的なログでリクエストを処理"""
        
        # 相関IDを生成
        correlation_id = str(uuid.uuid4())
        
        # リクエスト状態に相関IDを追加
        request.state.correlation_id = correlation_id
        
        # リクエストをログ
        if self.log_requests:
            await self._log_request(request, correlation_id)
        
        # リクエストを処理し時間を測定
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # レスポンスをログ
            if self.log_responses:
                await self._log_response(request, response, correlation_id, process_time)
            
            # レスポンスヘッダーに相関IDを追加
            response.headers["X-Correlation-ID"] = correlation_id
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            
            # エラーをログ
            await self._log_error(request, e, correlation_id, process_time)
            
            # 例外を再発生
            raise
    
    async def _log_request(self, request: Request, correlation_id: str):
        """受信リクエストをログ"""
        
        # リクエスト情報を抽出
        request_info = {
            "correlation_id": correlation_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": self._sanitize_headers(dict(request.headers)),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
            "timestamp": time.time()
        }
        
        # 利用可能な場合はユーザー情報を追加
        user = request.scope.get("user")
        if user and isinstance(user, dict):
            request_info["user_id"] = user.get("sub")
            request_info["user_email"] = user.get("email")
        
        # 有効で大きすぎない場合はリクエストボディを追加
        if self.log_body and request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await self._get_request_body(request)
                if body and len(body) < 10000:  # ボディサイズを制限
                    request_info["body"] = body
            except Exception as e:
                logger.warning(f"Failed to read request body: {e}")
        
        # リクエストをログ
        logger.info(
            f"Request received: {request.method} {request.url.path}",
            extra=request_info
        )
    
    async def _log_response(self, request: Request, response: Response, correlation_id: str, process_time: float):
        """送信レスポンスをログ"""
        
        # レスポンス情報を抽出
        response_info = {
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": round(process_time, 4),
            "response_size": self._get_response_size(response),
            "headers": self._sanitize_headers(dict(response.headers)),
            "timestamp": time.time()
        }
        
        # 利用可能な場合はユーザー情報を追加
        user = request.scope.get("user")
        if user and isinstance(user, dict):
            response_info["user_id"] = user.get("sub")
        
        # ステータスコードに基づいてログレベルを決定
        if response.status_code >= 500:
            log_level = "error"
        elif response.status_code >= 400:
            log_level = "warning"
        else:
            log_level = "info"
        
        # レスポンスをログ
        getattr(logger, log_level)(
            f"Response sent: {request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)",
            extra=response_info
        )
    
    async def _log_error(self, request: Request, error: Exception, correlation_id: str, process_time: float):
        """リクエストエラーをログ"""
        
        error_info = {
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "process_time": round(process_time, 4),
            "timestamp": time.time()
        }
        
        # 利用可能な場合はユーザー情報を追加
        user = request.scope.get("user")
        if user and isinstance(user, dict):
            error_info["user_id"] = user.get("sub")
        
        # エラーをログ
        logger.error(
            f"Request error: {request.method} {request.url.path} - {type(error).__name__}: {str(error)}",
            extra=error_info,
            exc_info=True
        )
    
    def _sanitize_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """機密情報を削除してヘッダーをサニタイズ"""
        
        sensitive_headers = {
            "authorization",
            "cookie",
            "x-api-key",
            "x-auth-token",
            "x-access-token",
            "x-refresh-token"
        }
        
        sanitized = {}
        for key, value in headers.items():
            if key.lower() in sensitive_headers:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _get_client_ip(self, request: Request) -> str:
        """クライアントIPアドレスを取得"""
        
        # 転送ヘッダーをチェック
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # 直接クライアントIPにフォールバック
        if request.client:
            return request.client.host
        
        return "unknown"
    
    async def _get_request_body(self, request: Request) -> Optional[str]:
        """リクエストボディを文字列として取得"""
        
        try:
            body = await request.body()
            if body:
                # JSONとしてデコードを試行
                try:
                    json_body = json.loads(body.decode())
                    return json.dumps(json_body, indent=2)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # JSONでない場合は文字列として返す
                    return body.decode("utf-8", errors="replace")
        except Exception:
            pass
        
        return None
    
    def _get_response_size(self, response: Response) -> int:
        """レスポンスサイズをバイトで取得"""
        
        if hasattr(response, "body"):
            return len(response.body)
        
        # ストリーミングレスポンスの場合、サイズを簡単に取得できない
        if isinstance(response, StreamingResponse):
            return -1
        
        return 0


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """シンプルな相関IDミドルウェア"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """リクエストとレスポンスに相関IDを追加"""
        
        # ヘッダーから相関IDを取得するか新しいものを生成
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        
        # リクエスト状態に追加
        request.state.correlation_id = correlation_id
        
        # リクエストを処理
        response = await call_next(request)
        
        # レスポンスヘッダーに追加
        response.headers["X-Correlation-ID"] = correlation_id
        
        return response


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    """モニタリング用のリクエストメトリクスミドルウェア"""
    
    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.total_process_time = 0.0
        self.error_count = 0
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """リクエストメトリクスを収集"""
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # メトリクスを更新
            self.request_count += 1
            self.total_process_time += process_time
            
            # メトリクスヘッダーを追加
            response.headers["X-Request-Count"] = str(self.request_count)
            response.headers["X-Average-Process-Time"] = str(
                round(self.total_process_time / self.request_count, 4)
            )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            
            # エラーメトリクスを更新
            self.error_count += 1
            self.request_count += 1
            self.total_process_time += process_time
            
            # 例外を再発生
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        """現在のメトリクスを取得"""
        
        return {
            "request_count": self.request_count,
            "error_count": self.error_count,
            "total_process_time": self.total_process_time,
            "average_process_time": (
                self.total_process_time / self.request_count 
                if self.request_count > 0 else 0
            ),
            "error_rate": (
                self.error_count / self.request_count 
                if self.request_count > 0 else 0
            )
        }


# ログ用ユーティリティ関数
def log_request_start(request: Request, correlation_id: str):
    """リクエスト開始をログ"""
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else "unknown"
        }
    )


def log_request_end(request: Request, response: Response, correlation_id: str, process_time: float):
    """リクエスト終了をログ"""
    status_code = getattr(response, "status_code", 200)
    logger.info(
        f"Request completed: {request.method} {request.url.path} - {status_code} ({process_time:.4f}s)",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": status_code,
            "process_time": process_time
        }
    )


def log_request_error(request: Request, error: Exception, correlation_id: str, process_time: float):
    """リクエストエラーをログ"""
    logger.error(
        f"Request failed: {request.method} {request.url.path} - {type(error).__name__}: {str(error)}",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "process_time": process_time
        },
        exc_info=True
    )
