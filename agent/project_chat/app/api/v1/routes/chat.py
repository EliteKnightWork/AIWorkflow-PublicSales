"""
チャットルート
チャットストリーミング、履歴、管理エンドポイント
"""

import time
from models.company import CompanyFeature
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List

from api.v1.schemas.requests import (
    ChatStreamRequest,
    ChatHistoryRequest,
    ProjectUUIDRequest
)
from api.v1.schemas.responses import (
    ChatHistoryResponse,
    ChatStreamResponse,
    ClearHistoryResponse,
    ErrorResponse
)
from middleware.auth_middleware import get_current_user
from middleware.request_logging import log_request_start, log_request_end, log_request_error
from middleware.rate_limiting import rate_limit
from container import container
from core.exceptions import ValidationError, ProjectNotFoundError, UserNotFoundError
from core.logging import get_logger
from repository.user_repository import UserRepository
from repository.company_repository import CompanyRepository

logger = get_logger("chat_routes")

router = APIRouter(prefix="/projects", tags=["chat"])


@router.post("/{uuid}/chat_stream")
@rate_limit(limit=10, window=60)  # 1分間に10リクエスト
async def chat_stream(
    uuid: str,
    request: Request,
    body: ChatStreamRequest
):
    """
    プロジェクトのチャットレスポンスをストリーミング
    
    ユーザーメッセージに対するAIレスポンスのリアルタイムストリーミングを提供します。
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    start_time = time.time()
    
    try:
        # 入力長検証: 1000文字以下
        if len(body.input_text or "") > 1000:
            raise HTTPException(status_code=400, detail="Input message must be 1000 characters or fewer")

        # プロジェクトUUIDを検証
        try:
            ProjectUUIDRequest(uuid=uuid)
        except Exception as e:
            raise ValidationError(f"Invalid UUID format: {uuid}", details=str(e))
        
        # 認証されたユーザーを取得
        auth_user = get_current_user(request)
        # ユーザーの会社プラン検証（Premium のみ許可）
        # auth_user["sub"] は Auth0 user id として保存されている
        user_repo = UserRepository()
        user = user_repo.get_user_by_auth0_id(auth_user["sub"])
        if not user or user.company_id is None:
            raise HTTPException(status_code=400, detail="User is not associated with a company")

        company_repo = CompanyRepository()
        company = company_repo.get_company_by_id(user.company_id)
        if not company:
            raise HTTPException(status_code=400, detail="Company not found")

        # CompanyFeaturesでの検証追加
        if CompanyFeature.AI_CHAT not in company.features:
            raise HTTPException(status_code=400, detail="Company does not have AI chat feature")
        
        # チャットサービスを取得
        chat_service = container.get_chat_service_with_agent()
        
        def chat_stream_generator():
            """ストリーミングレスポンスチャンクを生成"""
            try:
                # サービス層を使用してチャットストリームを処理
                for chunk in chat_service.process_chat_stream(
                    project_uuid=uuid,
                    auth0_user_id=auth_user["sub"],
                    message=body.input_text
                ):
                    # レスポンスチャンクを作成
                    response_chunk = ChatStreamResponse(
                        chunk=chunk,
                        chunk_type=body.stream_mode,
                        is_final=False,
                        metadata={"user_id": auth_user["sub"]} if body.include_metadata else None
                    )
                    
                    # ストリームモードに基づいてフォーマット
                    if body.stream_mode == "json":
                        yield f"data: {response_chunk.json()}\n\n"
                    else:
                        yield chunk
                
                # 最終チャンクを送信
                final_chunk = ChatStreamResponse(
                    chunk="",
                    chunk_type="end",
                    is_final=True,
                    metadata={"user_id": auth_user["sub"]} if body.include_metadata else None
                )
                
                if body.stream_mode == "json":
                    yield f"data: {final_chunk.json()}\n\n"
                
            except Exception as e:
                logger.error(f"Chat stream error: {str(e)}", exc_info=True)
                
                error_chunk = ChatStreamResponse(
                    chunk="申し訳ございません。処理途中にエラーが発生しました。",
                    chunk_type="error",
                    is_final=True,
                    metadata={"error": str(e)} if body.include_metadata else None
                )
                
                if body.stream_mode == "json":
                    yield f"data: {error_chunk.json()}\n\n"
                else:
                    yield error_chunk.chunk
        
        # ストリーミングレスポンスを作成
        response = StreamingResponse(
            chat_stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Correlation-ID": correlation_id
            }
        )
        
        process_time = time.time() - start_time
        log_request_end(request, response, correlation_id, process_time)
        
        return response
        
    except (ValidationError, ProjectNotFoundError, UserNotFoundError) as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        raise e
    except Exception as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        logger.error(f"Unexpected error in chat stream: {str(e)}", exc_info=True)
        raise e


@router.get("/{uuid}/chat_history", response_model=ChatHistoryResponse)
@rate_limit(limit=100, window=300)  # 100 requests per 5 minutes
async def get_chat_history(
    uuid: str,
    request: Request,
    limit: int = 20,
    offset: int = 0,
    include_metadata: bool = False
):

    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    start_time = time.time()
    try:
        # プロジェクトUUIDを検証
        try:
            ProjectUUIDRequest(uuid=uuid)
        except Exception as e:
            raise ValidationError(f"Invalid UUID format: {uuid}", details=str(e))
        
        # ページネーションパラメータを検証
        if limit < 1 or limit > 100:
            raise ValidationError("Limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("Offset must be non-negative")
        
        # 認証されたユーザーを取得
        auth_user = get_current_user(request)
        
        # チャットサービスを取得
        chat_service = container.get_chat_service()
        
        # サービス層を使用してチャット履歴を取得
        chat_history = chat_service.get_chat_history(
            project_uuid=uuid,
            auth0_user_id=auth_user["sub"],
            limit=limit,
            offset=offset
        )
        
        # ページネーション用の総数を取得
        total_count = chat_service.get_chat_history_count(
            project_uuid=uuid,
            auth0_user_id=auth_user["sub"]
        )
        
        # レスポンスを作成
        response = ChatHistoryResponse.create(
            chat_history=chat_history,
            total_count=total_count,
            limit=limit,
            offset=offset,
            request_id=correlation_id
        )
        
        process_time = time.time() - start_time
        log_request_end(request, response, correlation_id, process_time)
        return response
        
    except (ValidationError, ProjectNotFoundError, UserNotFoundError) as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        logger.error(f"Unexpected error in get chat history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{uuid}/chat_history", response_model=ClearHistoryResponse)
@rate_limit(limit=20, window=300)  # 20 requests per 5 minutes
async def clear_chat_history(
    uuid: str,
    request: Request
):

    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    start_time = time.time()
    
    try:
        # プロジェクトUUIDを検証
        try:
            ProjectUUIDRequest(uuid=uuid)
        except Exception as e:
            raise ValidationError(f"Invalid UUID format: {uuid}", details=str(e))
        
        # 認証されたユーザーを取得
        auth_user = get_current_user(request)
        
        # チャットサービスを取得
        chat_service = container.get_chat_service()
        
        # サービス層を使用してチャット履歴をクリア
        success = chat_service.clear_chat_history(
            project_uuid=uuid,
            auth0_user_id=auth_user["sub"]
        )
        
        # クリアされたメッセージの数を取得
        cleared_count = chat_service.get_chat_history_count(
            project_uuid=uuid,
            auth0_user_id=auth_user["sub"]
        ) if not success else 0
        
        # レスポンスを作成
        response = ClearHistoryResponse.create(
            success=success,
            cleared_count=cleared_count,
            request_id=correlation_id
        )
        
        process_time = time.time() - start_time
        log_request_end(request, response, correlation_id, process_time)
        
        return response
        
    except (ValidationError, ProjectNotFoundError, UserNotFoundError) as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        logger.error(f"Unexpected error in clear chat history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{uuid}/chat_history/count")
@rate_limit(limit=100, window=300)  # 100 requests per 5 minutes
async def get_chat_history_count(
    uuid: str,
    request: Request
):

    correlation_id = getattr(request.state, "correlation_id", "unknown")
    log_request_start(request, correlation_id)
    
    start_time = time.time()
    
    try:
        # プロジェクトUUIDを検証
        try:
            ProjectUUIDRequest(uuid=uuid)
        except Exception as e:
            raise ValidationError(f"Invalid UUID format: {uuid}", details=str(e))
        
        # 認証されたユーザーを取得
        auth_user = get_current_user(request)
        
        # チャットサービスを取得
        chat_service = container.get_chat_service()
        
        # サービス層を使用して数を取得
        count = chat_service.get_chat_history_count(
            project_uuid=uuid,
            auth0_user_id=auth_user["sub"]
        )
        
        # レスポンスを作成
        response = {
            "status": "success",
            "data": {
                "count": count,
                "project_uuid": uuid
            },
            "request_id": correlation_id
        }
        
        process_time = time.time() - start_time
        log_request_end(request, response, correlation_id, process_time)
        
        return response
        
    except (ValidationError, ProjectNotFoundError, UserNotFoundError) as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        process_time = time.time() - start_time
        log_request_error(request, e, correlation_id, process_time)
        logger.error(f"Unexpected error in get chat history count: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
