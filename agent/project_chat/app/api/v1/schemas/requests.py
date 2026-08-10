"""
API v1 リクエストスキーマ
すべてのエンドポイントの包括的なリクエスト検証スキーマ
"""

import re
import html
from typing import Optional, List
from pydantic import BaseModel, Field, validator, root_validator
from datetime import datetime
from enum import Enum

from core.exceptions import ValidationError
from core.logging import get_logger

logger = get_logger("api_schemas")


class ChatStreamRequest(BaseModel):
    """チャットストリーミングエンドポイントのリクエストスキーマ"""
    
    input_text: str = Field(
        ..., 
        min_length=1, 
        max_length=5000,
        description="チャット会話用のユーザー入力テキスト"
    )
    
    stream_mode: Optional[str] = Field(
        default="text",
        description="ストリーミングモード: 'text' または 'json'"
    )
    
    include_metadata: Optional[bool] = Field(
        default=False,
        description="レスポンスにメタデータを含める"
    )
    
    @validator('input_text')
    def validate_input_text(cls, v):
        """入力テキストを検証しサニタイズ"""
        if not v or not v.strip():
            raise ValueError('入力テキストは空にできません')
        
        v = v.strip()
        
        # 意味のあるコンテンツをチェック
        if len(v.replace(' ', '').replace('\n', '').replace('\t', '')) < 1:
            raise ValueError('入力テキストには意味のあるコンテンツが含まれている必要があります')
        
        # HTMLエンティティをサニタイズ
        v = html.escape(v)
        
        # Check for potentially malicious patterns
        dangerous_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'data:text/html',
            r'vbscript:',
            r'onload\s*=',
            r'onerror\s*=',
            r'onclick\s*=',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                logger.warning(f"Potentially malicious input detected: {pattern}")
                raise ValueError('Input contains potentially malicious content')
        
        return v
    
    @validator('stream_mode')
    def validate_stream_mode(cls, v):
        """Validate stream mode"""
        if v not in ['text', 'json']:
            raise ValueError('Stream mode must be either "text" or "json"')
        return v
    
    @root_validator(skip_on_failure=True)
    def validate_request(cls, values):
        """Additional request validation"""
        input_text = values.get('input_text', '')
        
        # Check for spam patterns
        if len(input_text) > 100:
            words = input_text.split()
            if len(set(words)) < len(words) * 0.3:
                logger.warning("Potential spam detected: excessive repetition")
                raise ValueError('Input appears to contain excessive repetition')
        
        return values


class ChatHistoryRequest(BaseModel):
    """Request schema for chat history endpoint"""
    
    limit: Optional[int] = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of chat messages to retrieve"
    )
    
    offset: Optional[int] = Field(
        default=0,
        ge=0,
        description="Number of messages to skip"
    )
    
    include_metadata: Optional[bool] = Field(
        default=False,
        description="レスポンスにメタデータを含める"
    )
    
    @validator('limit')
    def validate_limit(cls, v):
        """Validate limit parameter"""
        if v < 1 or v > 100:
            raise ValueError('Limit must be between 1 and 100')
        return v
    
    @validator('offset')
    def validate_offset(cls, v):
        """Validate offset parameter"""
        if v < 0:
            raise ValueError('Offset must be non-negative')
        return v


class ProjectUUIDRequest(BaseModel):
    """Request schema for project UUID validation"""
    
    uuid: str = Field(
        ...,
        min_length=36,
        max_length=36,
        description="Project UUID"
    )
    
    @validator('uuid')
    def validate_uuid(cls, v):
        """Validate UUID format"""
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        if not re.match(uuid_pattern, v, re.IGNORECASE):
            raise ValueError('Invalid UUID format')
        return v.lower()


class HealthCheckRequest(BaseModel):
    """Request schema for health check endpoint"""
    
    include_details: Optional[bool] = Field(
        default=False,
        description="Include detailed health information"
    )
    
    check_dependencies: Optional[bool] = Field(
        default=False,
        description="Check external dependencies"
    )


class SearchRequest(BaseModel):
    """Request schema for search functionality"""
    
    query: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Search query"
    )
    
    search_type: Optional[str] = Field(
        default="general",
        description="Type of search to perform"
    )
    
    limit: Optional[int] = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of results"
    )
    
    @validator('query')
    def validate_query(cls, v):
        """Validate search query"""
        if not v or not v.strip():
            raise ValueError('Search query cannot be empty')
        
        v = v.strip()
        
        # Check for SQL injection patterns
        sql_patterns = [
            r'union\s+select',
            r'drop\s+table',
            r'delete\s+from',
            r'insert\s+into',
            r'update\s+set',
            r'--',
            r'/\*.*?\*/',
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                logger.warning(f"Potential SQL injection detected: {pattern}")
                raise ValueError('Search query contains potentially malicious content')
        
        return v
    
    @validator('search_type')
    def validate_search_type(cls, v):
        """Validate search type"""
        valid_types = ['general', 'projects', 'users', 'chat_history']
        if v not in valid_types:
            raise ValueError(f'Search type must be one of: {", ".join(valid_types)}')
        return v


class PaginationRequest(BaseModel):
    """Base pagination request schema"""
    
    page: int = Field(
        default=1,
        ge=1,
        le=1000,
        description="Page number"
    )
    
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Items per page"
    )
    
    @validator('page')
    def validate_page(cls, v):
        """Validate page number"""
        if v < 1:
            raise ValueError('Page number must be at least 1')
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        """Validate limit"""
        if v < 1 or v > 100:
            raise ValueError('Limit must be between 1 and 100')
        return v


class FilterRequest(BaseModel):
    """Base filter request schema"""
    
    start_date: Optional[datetime] = Field(
        default=None,
        description="Filter start date"
    )
    
    end_date: Optional[datetime] = Field(
        default=None,
        description="Filter end date"
    )
    
    @root_validator(skip_on_failure=True)
    def validate_date_range(cls, values):
        """Validate date range"""
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise ValueError('Start date must be before end date')
        
        return values


class SortRequest(BaseModel):
    """Base sort request schema"""
    
    sort_by: Optional[str] = Field(
        default="created_at",
        description="Field to sort by"
    )
    
    sort_order: Optional[str] = Field(
        default="desc",
        description="Sort order: 'asc' or 'desc'"
    )
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        """Validate sort order"""
        if v not in ['asc', 'desc']:
            raise ValueError('Sort order must be either "asc" or "desc"')
        return v.lower()


class BulkOperationRequest(BaseModel):
    """Request schema for bulk operations"""
    
    operation: str = Field(
        ...,
        description="Operation to perform"
    )
    
    items: List[str] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="List of items to process"
    )
    
    @validator('operation')
    def validate_operation(cls, v):
        """Validate operation type"""
        valid_operations = ['delete', 'update', 'archive', 'restore']
        if v not in valid_operations:
            raise ValueError(f'Operation must be one of: {", ".join(valid_operations)}')
        return v
    
    @validator('items')
    def validate_items(cls, v):
        """Validate items list"""
        if not v:
            raise ValueError('Items list cannot be empty')
        
        # Check for duplicate items
        if len(v) != len(set(v)):
            raise ValueError('Items list contains duplicates')
        
        return v
