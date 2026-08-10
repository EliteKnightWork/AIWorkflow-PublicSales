from typing import Optional, Dict, Any


class AgentBaseException(Exception):
    """すべてのエージェント関連エラーのベース例外クラス"""

    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ConfigurationError(AgentBaseException):
    """設定関連エラーが発生した場合に発生"""

    pass


class DatabaseError(AgentBaseException):
    """データベース関連エラーが発生した場合に発生"""

    pass


class AuthenticationError(AgentBaseException):
    """認証関連エラーが発生した場合に発生"""

    pass


class AuthorizationError(AgentBaseException):
    """認可関連エラーが発生した場合に発生"""

    pass


class LLMError(AgentBaseException):
    """LLM関連エラーが発生した場合に発生"""

    pass


class ProjectNotFoundError(AgentBaseException):
    """プロジェクトが見つからない場合に発生"""

    pass


class UserNotFoundError(AgentBaseException):
    """ユーザーが見つからない場合に発生"""

    pass


class ChatHistoryError(AgentBaseException):
    """チャット履歴操作でエラーが発生した場合に発生"""

    pass


class ValidationError(AgentBaseException):
    """検証エラーが発生した場合に発生"""

    pass


class ExternalServiceError(AgentBaseException):
    """外部サービスでエラーが発生した場合に発生"""

    pass


class RateLimitError(AgentBaseException):
    """レート制限を超えた場合に発生"""

    pass


class TimeoutError(AgentBaseException):
    """操作がタイムアウトした場合に発生"""

    pass


