from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from core.config import get_config
from middleware.auth_middleware import AuthMiddleware
from middleware.rate_limiting import RateLimitingMiddleware
from middleware.request_logging import RequestLoggingMiddleware, CorrelationIDMiddleware
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.error_handler import setup_error_handlers
from api.v1.router import api_router
from api.v1.docs import add_api_documentation
from core.logging import get_logger

logger = get_logger("main")

# 設定を取得
config = get_config()

# FastAPIアプリケーションを作成
app = FastAPI(
    title="LabID Agent API",
    description="AI-powered project chat agent API",
    version="1.0.0",
    docs_url="/docs" if config.is_development else None,
    redoc_url="/redoc" if config.is_development else None,
    openapi_url="/openapi.json" if config.is_development else None
)

# ミドルウェアを順序で追加（最後に追加されたものが最初に実行される）
# 1. セキュリティヘッダー（最外層）
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORSミドルウェア
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors.allow_origins,
    allow_credentials=config.cors.allow_credentials,
    allow_methods=config.cors.allow_methods,
    allow_headers=config.cors.allow_headers,
    max_age=config.cors.max_age,
)

# 3. 相関IDミドルウェア
app.add_middleware(CorrelationIDMiddleware)

# 4. リクエストログミドルウェア
app.add_middleware(
    RequestLoggingMiddleware,
    log_requests=True,
    log_responses=True,
    log_body=config.is_development  # 開発環境でのみリクエストボディをログ
)

# 5. レート制限ミドルウェア
app.add_middleware(RateLimitingMiddleware)

# 6. 認証ミドルウェア（最内層 - 最初に実行される）
app.add_middleware(AuthMiddleware)

# エラーハンドラーをセットアップ
setup_error_handlers(app)

# APIルートを含める
app.include_router(api_router)

# APIドキュメントを追加
add_api_documentation(app)

# 後方互換性のためのレガシーエンドポイント
@app.get("/health", include_in_schema=False)
async def legacy_health_check():
    """後方互換性のためのレガシーヘルスチェックエンドポイント"""
    return {"health": "OK", "version": "1.0.0", "timestamp": time.time()}

# ルートエンドポイント
@app.get("/", include_in_schema=False)
async def root():
    """API情報を含むルートエンドポイント"""
    return {
        "message": "LabID Agent API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs" if config.is_development else None,
        "api_url": "/api/v1"
    }

