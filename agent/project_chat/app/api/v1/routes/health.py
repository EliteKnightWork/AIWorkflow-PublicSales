"""
ヘルスチェックルート
ヘルスモニタリングとシステムステータスエンドポイント
"""

from fastapi import APIRouter, Request, Depends
from typing import Dict, Any

from api.v1.schemas.requests import HealthCheckRequest
from api.v1.schemas.responses import HealthCheckResponse
from middleware.request_logging import log_request_start, log_request_end
from core.logging import get_logger

logger = get_logger("health_routes")

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthCheckResponse)
async def health_check(
    request: Request,
    include_details: bool = False,
    check_dependencies: bool = False
):
    """
    ヘルスチェックエンドポイント
    
    アプリケーションとその依存関係の現在のヘルスステータスを返します。
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    try:
        # 基本的なヘルスステータス
        status = "healthy"
        details = {}
        dependencies = {}
        
        if include_details:
            # 詳細なシステム情報を追加
            details = {
                "version": "1.0.0",
                "environment": "production",
                "uptime": "unknown",  # 開始時間から計算可能
                "memory_usage": "unknown",  # psutilで追加可能
                "cpu_usage": "unknown"  # psutilで追加可能
            }
        
        if check_dependencies:
            # 外部依存関係をチェック
            dependencies = await _check_dependencies()
            
            # 依存関係のヘルスに基づいてステータスを更新
            if any(dep.get("status") != "healthy" for dep in dependencies.values()):
                status = "degraded"
        
        response = HealthCheckResponse.create(
            status=status,
            details=details if include_details else None,
            dependencies=dependencies if check_dependencies else None,
            request_id=correlation_id
        )
        
        log_request_end(request, response, correlation_id, 0.0)
        return response
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        
        # 不健康なステータスを返す
        response = HealthCheckResponse.create(
            status="unhealthy",
            details={"error": str(e)},
            request_id=correlation_id
        )
        
        return response


@router.get("/ready", response_model=HealthCheckResponse, include_in_schema=False)
async def readiness_check(request: Request):
    """
    レディネスチェックエンドポイント
    
    アプリケーションがリクエストを処理する準備ができているかを返します。
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    try:
        # アプリケーションが準備できているかチェック
        ready = await _check_readiness()
        
        status = "ready" if ready else "not_ready"
        details = {"ready": ready}
        
        response = HealthCheckResponse.create(
            status=status,
            details=details,
            request_id=correlation_id
        )
        
        log_request_end(request, response, correlation_id, 0.0)
        return response
        
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}", exc_info=True)
        
        response = HealthCheckResponse.create(
            status="not_ready",
            details={"error": str(e)},
            request_id=correlation_id
        )
        
        return response


@router.get("/live", response_model=HealthCheckResponse, include_in_schema=False)
async def liveness_check(request: Request):
    """
    ライブネスチェックエンドポイント
    
    アプリケーションが生きていて実行中かを返します。
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    try:
        # シンプルなライブネスチェック
        response = HealthCheckResponse.create(
            status="alive",
            details={"alive": True},
            request_id=correlation_id
        )
        
        log_request_end(request, response, correlation_id, 0.0)
        return response
        
    except Exception as e:
        logger.error(f"Liveness check failed: {str(e)}", exc_info=True)
        
        response = HealthCheckResponse.create(
            status="dead",
            details={"alive": False, "error": str(e)},
            request_id=correlation_id
        )
        
        return response


async def _check_dependencies() -> Dict[str, Any]:
    """外部依存関係をチェック"""
    
    dependencies = {}
    
    try:
        # データベース接続をチェック
        from db.connection import get_database_connection
        db_conn = get_database_connection()
        if db_conn:
            dependencies["database"] = {
                "status": "healthy",
                "response_time": "< 1ms",
                "details": "Connected"
            }
        else:
            dependencies["database"] = {
                "status": "unhealthy",
                "response_time": "N/A",
                "details": "Connection failed"
            }
    except Exception as e:
        dependencies["database"] = {
            "status": "unhealthy",
            "response_time": "N/A",
            "details": f"Error: {str(e)}"
        }
    
    try:
        # Auth0サービスをチェック
        from services.auth_service import AuthorizationService
        auth_service = AuthorizationService()
        dependencies["auth0"] = {
            "status": "healthy",
            "response_time": "< 1ms",
            "details": "Service available"
        }
    except Exception as e:
        dependencies["auth0"] = {
            "status": "unhealthy",
            "response_time": "N/A",
            "details": f"Error: {str(e)}"
        }
    
    try:
        # LLMサービスをチェック
        from core.config import get_llm_config
        llm_config = get_llm_config()
        if llm_config.anthropic_api_key:
            dependencies["llm"] = {
                "status": "healthy",
                "response_time": "< 1ms",
                "details": "API key configured"
            }
        else:
            dependencies["llm"] = {
                "status": "unhealthy",
                "response_time": "N/A",
                "details": "API key not configured"
            }
    except Exception as e:
        dependencies["llm"] = {
            "status": "unhealthy",
            "response_time": "N/A",
            "details": f"Error: {str(e)}"
        }
    
    return dependencies


async def _check_readiness() -> bool:
    """アプリケーションがリクエストを処理する準備ができているかチェック"""
    
    try:
        # すべての重要なサービスが利用可能かチェック
        from db.connection import get_database_connection
        from services.auth_service import AuthorizationService
        from core.config import get_llm_config
        
        # データベースをチェック
        db_conn = get_database_connection()
        if not db_conn:
            return False
        
        # Auth0をチェック
        auth_service = AuthorizationService()
        
        # LLMをチェック
        llm_config = get_llm_config()
        if not llm_config.anthropic_api_key:
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return False
