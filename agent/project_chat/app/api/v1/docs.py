"""
API v1 ドキュメント
OpenAPIドキュメントとAPIバージョニングサポート
"""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from typing import Dict, Any

from core.config import get_config

config = get_config()


def create_openapi_schema(app: FastAPI) -> Dict[str, Any]:
    """API v1用のカスタムOpenAPIスキーマを作成"""
    
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="LabID Agent API v1",
        version="1.0.0",
        description="""
        # LabID Agent API v1
        
        包括的な機能を持つAI駆動プロジェクトチャットエージェントAPI:
        
        ## 機能
        - **リアルタイムチャットストリーミング**: AIレスポンスをリアルタイムでストリーミング
        - **チャット履歴管理**: チャット履歴の取得と管理
        - **レート制限**: インメモリ(cachetools)ベースの内蔵レート制限
        - **リクエストログ**: 包括的なリクエスト/レスポンスログ
        - **認証**: Auth0を使用したJWTベース認証
        - **エラーハンドリング**: 標準化されたエラーレスポンス
        - **ヘルスモニタリング**: ヘルスチェックとモニタリングエンドポイント
        
        ## 認証
        すべてのエンドポイント（ヘルスチェックを除く）はJWT認証が必要です。
        AuthorizationヘッダーにJWTトークンを含めてください:
        ```
        Authorization: Bearer <your-jwt-token>
        ```
        
        ## レート制限
        APIエンドポイントには異なるレート制限があります:
        - チャットストリーミング: 1分間に10リクエスト
        - チャット履歴: 5分間に100リクエスト
        - 履歴クリア: 5分間に20リクエスト
        - ヘルスチェック: 1分間に1000リクエスト
        
        ## エラーハンドリング
        すべてのエラーは標準化されたJSONレスポンスを返します:
        - `error.id`: 一意のエラー識別子
        - `error.type`: エラータイプ
        - `error.message`: 人間が読めるエラーメッセージ
        - `error.code`: 機械可読エラーコード（利用可能な場合）
        - `error.details`: 追加のエラー詳細（利用可能な場合）
        
        ## 相関ID
        すべてのリクエストには追跡用の相関IDが含まれます:
        - リクエスト: `X-Correlation-ID`ヘッダー
        - レスポンス: `X-Correlation-ID`ヘッダー
        - ログ: リクエスト追跡用の相関IDを含む
        
        ## バージョニング
        これはAPIバージョン1です。将来のバージョンは`/api/v2`などで利用可能になります。
        """,
        routes=app.routes,
    )
    
    # カスタムOpenAPI拡張を追加
    openapi_schema["info"]["x-logo"] = {
        "url": "https://example.com/logo.png"
    }
    
    openapi_schema["info"]["contact"] = {
        "name": "LabID サポート",
        "email": "support@labid.com",
        "url": "https://labid.com/support"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    # サーバー情報を追加
    openapi_schema["servers"] = [
        {
            "url": "https://api.labid.com",
            "description": "本番サーバー"
        },
        {
            "url": "https://staging-api.labid.com",
            "description": "ステージングサーバー"
        },
        {
            "url": "http://localhost:3001",
            "description": "開発サーバー"
        }
    ]
    
    # componentsセクションが存在することを確認
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    
    # セキュリティスキームを追加
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Auth0からのJWTトークン"
        }
    }
    
    # グローバルセキュリティ要件を追加
    openapi_schema["security"] = [
        {"BearerAuth": []}
    ]
    
    # カスタムタグを追加
    openapi_schema["tags"] = [
        {
            "name": "health",
            "description": "ヘルスモニタリングとシステムステータスエンドポイント"
        },
        {
            "name": "chat",
            "description": "チャットストリーミング、履歴、管理エンドポイント"
        }
    ]
    
    # 一般的なレスポンスの例を追加
    if "examples" not in openapi_schema["components"]:
        openapi_schema["components"]["examples"] = {}
    
    openapi_schema["components"]["examples"].update({
        "ChatStreamRequest": {
            "summary": "チャットストリームリクエストの例",
            "value": {
                "input_text": "こんにちは、プロジェクトについてどのようにサポートできますか？",
                "stream_mode": "text",
                "include_metadata": False
            }
        },
        "ChatHistoryResponse": {
            "summary": "チャット履歴レスポンスの例",
            "value": {
                "status": "success",
                "message": "チャット履歴が正常に取得されました",
                "data": {
                    "chat_history": [
                        {
                            "id": 1,
                            "user_id": 123,
                            "project_id": 456,
                            "message": "こんにちは、どのようにサポートできますか？",
                            "is_user_message": True,
                            "created_at": "2024-01-01T12:00:00Z",
                            "updated_at": None,
                            "metadata": None
                        }
                    ],
                    "count": 1
                },
                "pagination": {
                    "total_count": 1,
                    "limit": 20,
                    "offset": 0,
                    "has_next": False,
                    "has_previous": False
                },
                "request_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        },
        "ErrorResponse": {
            "summary": "エラーレスポンスの例",
            "value": {
                "status": "error",
                "message": "バリデーションに失敗しました",
                "error_code": "VALIDATION_ERROR",
                "error_details": {
                    "field": "input_text",
                    "message": "入力テキストは空にできません"
                },
                "request_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }
    })
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


def add_api_documentation(app: FastAPI):
    """包括的なAPIドキュメントを追加"""
    
    # カスタムOpenAPIスキーマを設定
    app.openapi = lambda: create_openapi_schema(app)
    
    # カスタムドキュメントルートを追加（Swaggerからは非表示）
    @app.get("/api/v1/docs/health", tags=["documentation"], include_in_schema=False)
    async def api_health_docs():
        """APIヘルスドキュメント"""
        return {
            "endpoints": [
                {
                    "path": "/api/v1/health",
                    "method": "GET",
                    "description": "基本的なヘルスチェック",
                    "parameters": [
                        {
                            "name": "include_details",
                            "type": "boolean",
                            "required": False,
                            "description": "詳細なシステム情報を含める"
                        },
                        {
                            "name": "check_dependencies",
                            "type": "boolean",
                            "required": False,
                            "description": "外部依存関係をチェック"
                        }
                    ]
                },
                {
                    "path": "/api/v1/health/ready",
                    "method": "GET",
                    "description": "レディネスチェック",
                    "parameters": []
                },
                {
                    "path": "/api/v1/health/live",
                    "method": "GET",
                    "description": "ライブネスチェック",
                    "parameters": []
                }
            ]
        }
    
    @app.get("/api/v1/docs/chat", tags=["documentation"], include_in_schema=False)
    async def api_chat_docs():
        """APIチャットドキュメント"""
        return {
            "endpoints": [
                {
                    "path": "/api/v1/projects/{uuid}/chat_stream",
                    "method": "POST",
                    "description": "チャットレスポンスをストリーミング",
                    "rate_limit": "1分間に10リクエスト",
                    "parameters": [
                        {
                            "name": "uuid",
                            "type": "string",
                            "required": True,
                            "description": "プロジェクトUUID"
                        }
                    ],
                    "body": {
                        "input_text": "string (必須)",
                        "stream_mode": "string (オプション、デフォルト: 'text')",
                        "include_metadata": "boolean (オプション、デフォルト: false)"
                    }
                },
                {
                    "path": "/api/v1/projects/{uuid}/chat_history",
                    "method": "GET",
                    "description": "チャット履歴を取得",
                    "rate_limit": "5分間に100リクエスト",
                    "parameters": [
                        {
                            "name": "uuid",
                            "type": "string",
                            "required": True,
                            "description": "プロジェクトUUID"
                        },
                        {
                            "name": "limit",
                            "type": "integer",
                            "required": False,
                            "description": "取得するメッセージ数 (1-100)"
                        },
                        {
                            "name": "offset",
                            "type": "integer",
                            "required": False,
                            "description": "スキップするメッセージ数"
                        }
                    ]
                },
                {
                    "path": "/api/v1/projects/{uuid}/chat_history",
                    "method": "DELETE",
                    "description": "チャット履歴をクリア",
                    "rate_limit": "5分間に20リクエスト",
                    "parameters": [
                        {
                            "name": "uuid",
                            "type": "string",
                            "required": True,
                            "description": "プロジェクトUUID"
                        }
                    ]
                }
            ]
        }
    
    @app.get("/api/v1/docs/rate-limits", tags=["documentation"], include_in_schema=False)
    async def api_rate_limits_docs():
        """APIレート制限ドキュメント"""
        return {
            "rate_limits": [
                {
                    "endpoint": "/api/v1/health",
                    "limit": 1000,
                    "window": "1分",
                    "description": "ヘルスチェックエンドポイント"
                },
                {
                    "endpoint": "/api/v1/projects/{uuid}/chat_stream",
                    "limit": 10,
                    "window": "1分",
                    "description": "チャットストリーミングエンドポイント"
                },
                {
                    "endpoint": "/api/v1/projects/{uuid}/chat_history",
                    "limit": 100,
                    "window": "5分",
                    "description": "チャット履歴取得"
                },
                {
                    "endpoint": "/api/v1/projects/{uuid}/chat_history (DELETE)",
                    "limit": 20,
                    "window": "5分",
                    "description": "チャット履歴クリア"
                }
            ],
            "headers": [
                {
                    "name": "X-RateLimit-Limit",
                    "description": "許可される最大リクエスト数"
                },
                {
                    "name": "X-RateLimit-Remaining",
                    "description": "現在のウィンドウ内の残りリクエスト数"
                },
                {
                    "name": "X-RateLimit-Reset",
                    "description": "レート制限がリセットされるUnixタイムスタンプ"
                },
                {
                    "name": "Retry-After",
                    "description": "再試行前の待機秒数（レート制限時）"
                }
            ]
        }
