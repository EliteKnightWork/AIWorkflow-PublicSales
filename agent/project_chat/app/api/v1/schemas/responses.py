"""
API v1 Response Schemas
Comprehensive response schemas for all endpoints
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

from models.project_chat import ProjectChat, ChatRole


class ResponseStatus(str, Enum):
    """Response status enumeration"""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class BaseResponse(BaseModel):
    """Base response schema"""
    
    status: ResponseStatus = Field(
        ...,
        description="Response status"
    )
    
    message: Optional[str] = Field(
        default=None,
        description="Response message"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response timestamp"
    )
    
    request_id: Optional[str] = Field(
        default=None,
        description="Request correlation ID"
    )


class ErrorResponse(BaseResponse):
    """Error response schema"""
    
    status: ResponseStatus = Field(
        default=ResponseStatus.ERROR,
        description="Response status"
    )
    
    error_code: Optional[str] = Field(
        default=None,
        description="Error code"
    )
    
    error_details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional error details"
    )
    
    trace_id: Optional[str] = Field(
        default=None,
        description="Error trace ID for debugging"
    )


class SuccessResponse(BaseResponse):
    """Success response schema"""
    
    status: ResponseStatus = Field(
        default=ResponseStatus.SUCCESS,
        description="Response status"
    )
    
    data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Response data"
    )


class ChatMessageResponse(BaseModel):
    """Individual chat message response schema"""
    
    id: int = Field(
        ...,
        description="Message ID"
    )
    
    user_id: int = Field(
        ...,
        description="User ID"
    )
    
    project_id: int = Field(
        ...,
        description="Project ID"
    )
    
    value: str = Field(
        ...,
        description="Message content"
    )
    
    role: ChatRole = Field(
        ...,
        description="Whether this is a user message"
    )
    
    created_at: datetime = Field(
        ...,
        description="Message creation timestamp"
    )
    
    updated_at: Optional[datetime] = Field(
        default=None,
        description="Message update timestamp"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional message metadata"
    )
    
    @classmethod
    def from_project_chat(cls, chat: ProjectChat) -> "ChatMessageResponse":
        """Create response from ProjectChat model"""
        return cls(
            id=int(chat.id) if chat.id is not None else 0,
            user_id=int(chat.user_id),
            project_id=int(chat.project_id),
            value=chat.value,
            role=chat.role,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            metadata=chat.metadata
        )


class ChatHistoryResponse(SuccessResponse):
    """Chat history response schema"""
    
    data: Dict[str, Any] = Field(
        ...,
        description="Chat history data"
    )
    
    pagination: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Pagination information"
    )
    
    @classmethod
    def create(
        cls,
        chat_history: List[ProjectChat],
        total_count: int,
        limit: int,
        offset: int,
        request_id: Optional[str] = None
    ) -> "ChatHistoryResponse":
        """Create chat history response"""
        messages = [ChatMessageResponse.from_project_chat(chat) for chat in chat_history]
        
        pagination = {
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_next": offset + limit < total_count,
            "has_previous": offset > 0
        }
        
        return cls(
            status=ResponseStatus.SUCCESS,
            message="Chat history retrieved successfully",
            data={
                "chat_history": [msg.dict() for msg in messages],
                "count": len(messages)
            },
            pagination=pagination,
            request_id=request_id
        )


class ChatStreamResponse(BaseModel):
    """Chat stream response schema"""
    
    chunk: str = Field(
        ...,
        description="Stream chunk content"
    )
    
    chunk_type: str = Field(
        default="text",
        description="Type of chunk: 'text', 'metadata', 'error'"
    )
    
    is_final: bool = Field(
        default=False,
        description="Whether this is the final chunk"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Chunk metadata"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Chunk timestamp"
    )


class HealthCheckResponse(SuccessResponse):
    """Health check response schema"""
    
    data: Dict[str, Any] = Field(
        ...,
        description="Health check data"
    )
    
    @classmethod
    def create(
        cls,
        status: str = "healthy",
        details: Optional[Dict[str, Any]] = None,
        dependencies: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> "HealthCheckResponse":
        """Create health check response"""
        data = {
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "environment": "production"
        }
        
        if details:
            data["details"] = details
        
        if dependencies:
            data["dependencies"] = dependencies
        
        return cls(
            status=ResponseStatus.SUCCESS,
            message="Health check completed",
            data=data,
            request_id=request_id
        )


class ClearHistoryResponse(SuccessResponse):
    """Clear chat history response schema"""
    
    data: Dict[str, Any] = Field(
        ...,
        description="Clear history operation data"
    )
    
    @classmethod
    def create(
        cls,
        success: bool,
        cleared_count: int = 0,
        request_id: Optional[str] = None
    ) -> "ClearHistoryResponse":
        """Create clear history response"""
        return cls(
            status=ResponseStatus.SUCCESS,
            message="Chat history cleared successfully" if success else "No chat history found to clear",
            data={
                "success": success,
                "cleared_count": cleared_count,
                "timestamp": datetime.utcnow().isoformat()
            },
            request_id=request_id
        )


class SearchResponse(SuccessResponse):
    """Search response schema"""
    
    data: Dict[str, Any] = Field(
        ...,
        description="Search results data"
    )
    
    pagination: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Pagination information"
    )
    
    @classmethod
    def create(
        cls,
        results: List[Dict[str, Any]],
        total_count: int,
        query: str,
        search_type: str,
        limit: int,
        offset: int,
        request_id: Optional[str] = None
    ) -> "SearchResponse":
        """Create search response"""
        pagination = {
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_next": offset + limit < total_count,
            "has_previous": offset > 0
        }
        
        return cls(
            status=ResponseStatus.SUCCESS,
            message=f"Search completed for query: {query}",
            data={
                "results": results,
                "query": query,
                "search_type": search_type,
                "count": len(results)
            },
            pagination=pagination,
            request_id=request_id
        )


class BulkOperationResponse(SuccessResponse):
    """Bulk operation response schema"""
    
    data: Dict[str, Any] = Field(
        ...,
        description="Bulk operation results"
    )
    
    @classmethod
    def create(
        cls,
        operation: str,
        total_items: int,
        successful_items: int,
        failed_items: int,
        errors: Optional[List[Dict[str, Any]]] = None,
        request_id: Optional[str] = None
    ) -> "BulkOperationResponse":
        """Create bulk operation response"""
        return cls(
            status=ResponseStatus.SUCCESS,
            message=f"Bulk {operation} operation completed",
            data={
                "operation": operation,
                "total_items": total_items,
                "successful_items": successful_items,
                "failed_items": failed_items,
                "success_rate": successful_items / total_items if total_items > 0 else 0,
                "errors": errors or [],
                "timestamp": datetime.utcnow().isoformat()
            },
            request_id=request_id
        )


class ValidationErrorResponse(ErrorResponse):
    """Validation error response schema"""
    
    status: ResponseStatus = Field(
        default=ResponseStatus.ERROR,
        description="Response status"
    )
    
    error_code: str = Field(
        default="VALIDATION_ERROR",
        description="Error code"
    )
    
    validation_errors: List[Dict[str, Any]] = Field(
        ...,
        description="Detailed validation errors"
    )
    
    @classmethod
    def create(
        cls,
        validation_errors: List[Dict[str, Any]],
        request_id: Optional[str] = None
    ) -> "ValidationErrorResponse":
        """Create validation error response"""
        return cls(
            status=ResponseStatus.ERROR,
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            validation_errors=validation_errors,
            request_id=request_id
        )


class RateLimitResponse(ErrorResponse):
    """Rate limit error response schema"""
    
    status: ResponseStatus = Field(
        default=ResponseStatus.ERROR,
        description="Response status"
    )
    
    error_code: str = Field(
        default="RATE_LIMIT_EXCEEDED",
        description="Error code"
    )
    
    retry_after: Optional[int] = Field(
        default=None,
        description="Seconds to wait before retrying"
    )
    
    @classmethod
    def create(
        cls,
        retry_after: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> "RateLimitResponse":
        """Create rate limit response"""
        return cls(
            status=ResponseStatus.ERROR,
            message="Rate limit exceeded",
            error_code="RATE_LIMIT_EXCEEDED",
            retry_after=retry_after,
            request_id=request_id
        )
