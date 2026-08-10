"""
レート制限ミドルウェア
インメモリ（cachetools）で設定可能な制限を持つレート制限を実装
"""

import time
from functools import wraps
from typing import Dict, Optional, Callable
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from cachetools import TTLCache

from core.config import get_config
from core.logging import get_logger
from api.v1.schemas.responses import RateLimitResponse

logger = get_logger("rate_limiting")


class RateLimitConfig:
    """レート制限設定"""
    
    def __init__(self):
        self.config = get_config()
        # ウィンドウ秒ごとに独立したTTLキャッシュを持つ（固定ウィンドウ方式）
        # 値はミュータブルな辞書 {"count": int, "reset_time": int} を格納することで、
        # 値更新時にTTLをリセットしない（固定ウィンドウ）実装を可能にする
        self._window_caches: Dict[int, TTLCache] = {}
        # デフォルトのキャッシュ上限（必要に応じて調整）
        self._default_maxsize = 10000
        # 既知のウィンドウについては事前に作成
        for window in (60, 300):
            self._ensure_cache(window)

    def _ensure_cache(self, window: int) -> TTLCache:
        """指定されたウィンドウ秒数のTTLキャッシュを用意して返す"""
        cache = self._window_caches.get(window)
        if cache is None:
            cache = TTLCache(maxsize=self._default_maxsize, ttl=window)
            self._window_caches[window] = cache
        return cache
    
    def get_rate_limit_key(self, identifier: str, endpoint: str) -> str:
        """レート制限キーを生成"""
        return f"rate_limit:{identifier}:{endpoint}"
    
    def get_rate_limit(self, identifier: str, endpoint: str, method: str) -> Dict[str, int]:
        """現在のレート制限ステータスを取得（固定ウィンドウ）"""
        key = self.get_rate_limit_key(identifier, endpoint)
        limit = self._get_limit_for_endpoint(endpoint, method)
        window = self._get_window_for_endpoint(endpoint, method)
        cache = self._ensure_cache(window)

        value = cache.get(key)
        if value is None:
            return {"count": 0, "limit": limit, "reset_time": int(time.time()) + window}

        # value は {"count": int, "reset_time": int}
        return {
            "count": int(value.get("count", 0)),
            "limit": limit,
            "reset_time": int(value.get("reset_time", int(time.time()) + window))
        }
    
    def increment_rate_limit(self, identifier: str, endpoint: str, method: str) -> bool:
        """レート制限カウンターを増分（固定ウィンドウ）"""
        key = self.get_rate_limit_key(identifier, endpoint)
        limit = self._get_limit_for_endpoint(endpoint, method)
        window = self._get_window_for_endpoint(endpoint, method)
        cache = self._ensure_cache(window)

        now = int(time.time())
        value = cache.get(key)
        if value is None:
            # 初回はカウント1で作成し、TTLはwindow（固定ウィンドウ）
            value = {"count": 1, "reset_time": now + window}
            cache[key] = value
            return 1 <= limit
        else:
            # ミュータブル値を直接変更し、TTLは維持（固定ウィンドウ）
            value_count = int(value.get("count", 0)) + 1
            value["count"] = value_count
            # reset_time は初回作成時のまま
            return value_count <= limit
    
    def _get_limit_for_endpoint(self, endpoint: str, method: str) -> int:
        """特定のエンドポイントのレート制限を取得"""
        limits = {
            ("GET", "/health"): 1000,  # ヘルスチェック
            ("GET", "/projects/{uuid}/chat_stream"): 10,  # チャットストリーミング
            ("GET", "/projects/{uuid}/chat_history"): 100,  # チャット履歴取得
            ("DELETE", "/projects/{uuid}/chat_history"): 20,  # 履歴クリア
        }
        
        # 一致するエンドポイントパターンを検索
        for (m, pattern), limit in limits.items():
            if m == method and self._endpoint_matches(pattern, endpoint):
                return limit
        
        return 100  # デフォルト制限
    
    def _get_window_for_endpoint(self, endpoint: str, method: str) -> int:
        """特定のエンドポイントの時間ウィンドウを取得"""
        windows = {
            ("GET", "/health"): 60,  # 1分
            ("GET", "/projects/{uuid}/chat_stream"): 60,  # 1分
            ("GET", "/projects/{uuid}/chat_history"): 300,  # 5分
            ("DELETE", "/projects/{uuid}/chat_history"): 300,  # 5分
        }
        
        # 一致するエンドポイントパターンを検索
        for (m, pattern), window in windows.items():
            if m == method and self._endpoint_matches(pattern, endpoint):
                return window
        
        return 300  # デフォルト5分
    
    def _endpoint_matches(self, pattern: str, endpoint: str) -> bool:
        """エンドポイントがパターンに一致するかチェック"""
        # シンプルなパターンマッチング - 正規表現で強化可能
        if "{" in pattern and "}" in pattern:
            # パラメータ化されたエンドポイントを処理
            pattern_parts = pattern.split("/")
            endpoint_parts = endpoint.split("/")
            
            if len(pattern_parts) != len(endpoint_parts):
                return False
            
            for p_part, e_part in zip(pattern_parts, endpoint_parts):
                if p_part.startswith("{") and p_part.endswith("}"):
                    continue  # パラメータは任意の値に一致
                if p_part != e_part:
                    return False
            
            return True
        
        return pattern == endpoint


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """レート制限ミドルウェア"""
    
    def __init__(self, app, config: Optional[RateLimitConfig] = None):
        super().__init__(app)
        self.config = config or RateLimitConfig()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """レート制限でリクエストを処理"""
        
        # 特定のエンドポイントではレート制限をスキップ
        if self._should_skip_rate_limiting(request):
            return await call_next(request)
        
        # クライアント識別子を取得
        client_id = self._get_client_identifier(request)
        endpoint = self._normalize_endpoint(request.url.path)
        method = request.method.upper()
        
        # レート制限をチェック
        rate_limit_info = self.config.get_rate_limit(client_id, endpoint, method)
        
        # 制限を超えているかチェック
        if rate_limit_info["count"] >= rate_limit_info["limit"]:
            retry_after = rate_limit_info["reset_time"] - int(time.time())
            
            logger.warning(
                f"Rate limit exceeded for client {client_id} on endpoint {endpoint}",
                extra={
                    "client_id": client_id,
                    "endpoint": endpoint,
                    "count": rate_limit_info["count"],
                    "limit": rate_limit_info["limit"],
                    "retry_after": retry_after
                }
            )
            
            response = RateLimitResponse.create(retry_after=retry_after)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content=response.dict(),
                headers={
                    "X-RateLimit-Limit": str(rate_limit_info["limit"]),
                    "X-RateLimit-Remaining": str(max(0, rate_limit_info["limit"] - rate_limit_info["count"])),
                    "X-RateLimit-Reset": str(rate_limit_info["reset_time"]),
                    "Retry-After": str(retry_after)
                }
            )
        
        # レート制限カウンターを増分
        allowed = self.config.increment_rate_limit(client_id, endpoint, method)
        
        if not allowed:
            logger.warning(
                f"Rate limit exceeded for client {client_id} on endpoint {endpoint}",
                extra={
                    "client_id": client_id,
                    "endpoint": endpoint
                }
            )
            
            response = RateLimitResponse.create()
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content=response.dict(),
                headers={
                    "X-RateLimit-Limit": str(rate_limit_info["limit"]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(rate_limit_info["reset_time"])
                }
            )
        
        # リクエストを処理
        response = await call_next(request)
        
        # レスポンスにレート制限ヘッダーを追加
        remaining = max(0, rate_limit_info["limit"] - rate_limit_info["count"] - 1)
        response.headers["X-RateLimit-Limit"] = str(rate_limit_info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(rate_limit_info["reset_time"])
        
        return response
    
    def _should_skip_rate_limiting(self, request: Request) -> bool:
        """このリクエストでレート制限をスキップすべきかチェック"""
        # ヘルスチェックではスキップ
        if request.url.path in {"/health", "/api/v1/health", "/api/v1/health/ready", "/api/v1/health/live"}:
            return True
        
        # OPTIONSリクエスト（CORSプリフライト）ではスキップ
        if request.method == "OPTIONS":
            return True
        
        return False

    def _normalize_endpoint(self, path: str) -> str:
        """レート制限のためにAPIバージョンプレフィックスを取り除く"""
        # 例: /api/v1/projects/123/chat_stream -> /projects/123/chat_stream
        if path.startswith("/api/v1/"):
            return path[len("/api/v1"):]
        return path
    
    def _get_client_identifier(self, request: Request) -> str:
        """レート制限用の一意のクライアント識別子を取得"""
        # 認証されている場合はリクエストスコープからユーザーIDを取得
        user = request.scope.get("user")
        if user and isinstance(user, dict):
            return f"user:{user.get('sub', 'unknown')}"
        
        # IPアドレスにフォールバック
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"


class RateLimitDecorator:
    """特定のエンドポイントにレート制限を適用するデコレーター"""
    
    def __init__(self, limit: int, window: int = 60):
        self.limit = limit
        self.window = window
        self.config = RateLimitConfig()
    
    def __call__(self, func):
        """関数にレート制限を適用"""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 引数からリクエストを抽出
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                return await func(*args, **kwargs)
            
            client_id = self._get_client_identifier(request)
            endpoint = request.url.path
            method = request.method.upper()
            
            # レート制限をチェック
            if not self.config.increment_rate_limit(client_id, endpoint, method):
                response = RateLimitResponse.create()
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content=response.dict()
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    
    def _get_client_identifier(self, request: Request) -> str:
        """一意のクライアント識別子を取得"""
        # 認証されている場合はリクエストスコープからユーザーIDを取得
        user = request.scope.get("user")
        if user and isinstance(user, dict):
            return f"user:{user.get('sub', 'unknown')}"
        
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"


# グローバルレート制限デコレーター
def rate_limit(limit: int, window: int = 60):
    """レート制限デコレーター"""
    return RateLimitDecorator(limit, window)
