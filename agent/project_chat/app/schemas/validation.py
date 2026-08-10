
import re
import html
from typing import Optional, List
from pydantic import BaseModel, Field, validator, root_validator
from core.exceptions import ValidationError
from core.logging import get_logger

logger = get_logger("validation")


class ChatRequest(BaseModel):
    """検証済みチャットリクエストスキーマ"""
    
    input_text: str = Field(
        ..., 
        min_length=1, 
        max_length=5000,
        description="User input text for chat"
    )
    
    @validator('input_text')
    def validate_input_text(cls, v):
        """入力テキストを検証・サニタイズ"""
        if not v:
            raise ValueError('Input text cannot be empty')
        
        # 空白を削除
        v = v.strip()
        
        if not v:
            raise ValueError('Input text cannot be empty after stripping whitespace')
        
        # 最小限の意味のあるコンテンツをチェック(空白や特殊文字のみではない)
        if len(v.replace(' ', '').replace('\n', '').replace('\t', '')) < 1:
            raise ValueError('Input text must contain meaningful content')
        
        # HTMLエンティティをサニタイズ
        v = html.escape(v)
        
        # 潜在的に悪意のあるパターンをチェック
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
    
    @root_validator(skip_on_failure=True)
    def validate_request(cls, values):
        """リクエスト全体の追加検証"""
        input_text = values.get('input_text', '')
        
        # 過度の繰り返しをチェック(スパムの可能性)
        if len(input_text) > 100:
            words = input_text.split()
            if len(set(words)) < len(words) * 0.3:  # Less than 30% unique words
                logger.warning("Potential spam detected: excessive repetition")
                raise ValueError('Input appears to contain excessive repetition')
        
        return values


class ProjectUUIDRequest(BaseModel):
    """検証済みプロジェクトUUIDリクエスト"""
    
    uuid: str = Field(
        ...,
        min_length=36,
        max_length=36,
        description="Project UUID"
    )
    
    @validator('uuid')
    def validate_uuid(cls, v):
        """UUIDフォーマットを検証"""
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        if not re.match(uuid_pattern, v, re.IGNORECASE):
            raise ValueError('Invalid UUID format')
        return v.lower()


class PaginationRequest(BaseModel):
    """検証済みページネーションリクエスト"""
    
    page: int = Field(default=1, ge=1, le=1000, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @validator('page')
    def validate_page(cls, v):
        """ページ番号を検証"""
        if v < 1:
            raise ValueError('Page number must be at least 1')
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        """制限値を検証"""
        if v < 1 or v > 100:
            raise ValueError('Limit must be between 1 and 100')
        return v


class SearchRequest(BaseModel):
    """検証済み検索リクエスト"""
    
    query: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Search query"
    )
    
    @validator('query')
    def validate_query(cls, v):
        """検索クエリを検証"""
        if not v or not v.strip():
            raise ValueError('Search query cannot be empty')
        
        v = v.strip()
        
        # SQLインジェクションパターンをチェック
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


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """文字列値をサニタイズ"""
    if not isinstance(value, str):
        raise ValidationError("Value must be a string")
    
    # トリムして長さを制限
    value = value.strip()[:max_length]
    
    # HTMLエンティティをエスケープ
    value = html.escape(value)
    
    return value


def validate_email(email: str) -> str:
    """メールアドレスフォーマットを検証"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format")
    return email.lower()


def validate_url(url: str) -> str:
    """URLフォーマットを検証"""
    url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    if not re.match(url_pattern, url):
        raise ValidationError("Invalid URL format")
    return url


def validate_phone_number(phone: str) -> str:
    """電話番号フォーマットを検証"""
    # 数字以外の文字をすべて削除
    digits_only = re.sub(r'\D', '', phone)
    
    # 有効な長さかチェック(7-15桁)
    if len(digits_only) < 7 or len(digits_only) > 15:
        raise ValidationError("Invalid phone number format")
    
    return digits_only


class InputSanitizer:
    """入力サニタイズ用ユーティリティクラス"""
    
    @staticmethod
    def sanitize_text(text: str, max_length: int = 1000) -> str:
        """テキスト入力をサニタイズ"""
        return sanitize_string(text, max_length)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """ファイル名をサニタイズ"""
        # 危険な文字を削除
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        # 長さを制限
        filename = filename[:255]
        return filename
    
    @staticmethod
    def sanitize_sql_identifier(identifier: str) -> str:
        """SQL識別子をサニタイズ"""
        # 英数字とアンダースコアのみ許可
        identifier = re.sub(r'[^a-zA-Z0-9_]', '', identifier)
        return identifier

