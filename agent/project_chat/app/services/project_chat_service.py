"""
プロジェクトチャットサービス - 新しいリポジトリパターンの使用例
"""
from typing import List, Optional
from models.user import User
from models.project import Project
from models.project_chat import ProjectChat, ChatRole
from repository import (
    get_user_repository,
    get_project_repository,
    get_chat_history_repository,
    TransactionManager
)
from core.exceptions import (
    UserNotFoundError,
    ProjectNotFoundError,
    ChatHistoryError,
    ValidationError
)
from core.logging import get_logger

logger = get_logger("project_chat_service")


class ProjectChatService:
    """リポジトリパターンを使用したプロジェクトチャット操作のサービスクラス"""
    
    def __init__(self):
        self.user_repo = get_user_repository()
        self.project_repo = get_project_repository()
        self.chat_repo = get_chat_history_repository()
    
    def get_user_chat_history(
        self, 
        auth0_user_id: str, 
        project_uuid: str, 
        limit: int = 10
    ) -> List[ProjectChat]:
        """
        ユーザーとプロジェクトのチャット履歴を取得
        
        Args:
            auth0_user_id: Auth0ユーザーID
            project_uuid: プロジェクトUUID
            limit: 返すチャットレコードの最大数
            
        Returns:
            ProjectChatインスタンスのリスト
            
        Raises:
            UserNotFoundError: ユーザーが見つからない場合
            ProjectNotFoundError: プロジェクトが見つからない場合
            ChatHistoryError: チャット履歴の取得が失敗した場合
        """
        try:
            logger.info(f"ユーザー {auth0_user_id}、プロジェクト {project_uuid} のチャット履歴を取得中")
            
            # Auth0 IDでユーザーを取得
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # UUIDでプロジェクトIDを取得
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # チャット履歴を取得
            chat_history = self.chat_repo.get_chat_history(
                project_id=str(project_id),
                user_id=str(user.id),
                limit=limit
            )
            
            logger.info(f"{len(chat_history)}件のチャットレコードを取得しました")
            return chat_history
            
        except (UserNotFoundError, ProjectNotFoundError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"チャット履歴取得中の予期せぬエラー: {str(e)}")
            raise ChatHistoryError(
                f"チャット履歴の取得に失敗しました: {str(e)}",
                error_code="GET_CHAT_HISTORY_SERVICE_ERROR"
            )
    
    def add_user_message(
        self, 
        auth0_user_id: str, 
        project_uuid: str, 
        message: str
    ) -> ProjectChat:
        """
        チャット履歴にユーザーメッセージを追加
        
        Args:
            auth0_user_id: Auth0ユーザーID
            project_uuid: プロジェクトUUID
            message: ユーザーメッセージの内容
            
        Returns:
            作成されたProjectChatインスタンス
            
        Raises:
            UserNotFoundError: ユーザーが見つからない場合
            ProjectNotFoundError: プロジェクトが見つからない場合
            ValidationError: メッセージが無効な場合
            ChatHistoryError: チャット作成が失敗した場合
        """
        try:
            logger.info(f"ユーザー {auth0_user_id}、プロジェクト {project_uuid} にユーザーメッセージを追加中")
            
            # メッセージを検証
            if not message or not message.strip():
                raise ValidationError("メッセージは空にできません")
            
            # Auth0 IDでユーザーを取得
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # UUIDでプロジェクトIDを取得
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # チャットメッセージを追加
            chat = self.chat_repo.add_chat(
                project_id=str(project_id),
                user_id=str(user.id),
                role=ChatRole.USER,
                value=message.strip()
            )
            
            logger.info(f"ユーザーメッセージを正常に追加しました")
            return chat
            
        except (UserNotFoundError, ProjectNotFoundError, ValidationError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"ユーザーメッセージ追加中の予期せぬエラー: {str(e)}")
            raise ChatHistoryError(
                f"ユーザーメッセージの追加に失敗しました: {str(e)}",
                error_code="ADD_USER_MESSAGE_SERVICE_ERROR"
            )
    
    def add_system_message(
        self, 
        auth0_user_id: str, 
        project_uuid: str, 
        message: str
    ) -> ProjectChat:
        """
        チャット履歴にシステムメッセージを追加
        
        Args:
            auth0_user_id: Auth0ユーザーID
            project_uuid: プロジェクトUUID
            message: システムメッセージの内容
            
        Returns:
            作成されたProjectChatインスタンス
            
        Raises:
            UserNotFoundError: ユーザーが見つからない場合
            ProjectNotFoundError: プロジェクトが見つからない場合
            ValidationError: メッセージが無効な場合
            ChatHistoryError: チャット作成が失敗した場合
        """
        try:
            logger.info(f"ユーザー {auth0_user_id}、プロジェクト {project_uuid} にシステムメッセージを追加中")
            
            # メッセージを検証
            if not message or not message.strip():
                raise ValidationError("システムメッセージは空にできません")
            
            # Auth0 IDでユーザーを取得
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # UUIDでプロジェクトIDを取得
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # チャットメッセージを追加
            chat = self.chat_repo.add_chat(
                project_id=str(project_id),
                user_id=str(user.id),
                role=ChatRole.SYSTEM,
                value=message.strip()
            )
            
            logger.info(f"システムメッセージを正常に追加しました")
            return chat
            
        except (UserNotFoundError, ProjectNotFoundError, ValidationError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"システムメッセージ追加中の予期せぬエラー: {str(e)}")
            raise ChatHistoryError(
                f"システムメッセージの追加に失敗しました: {str(e)}",
                error_code="ADD_SYSTEM_MESSAGE_SERVICE_ERROR"
            )
    
    def get_chat_context(
        self, 
        auth0_user_id: str, 
        project_uuid: str, 
        context_limit: int = 5
    ) -> List[ProjectChat]:
        """
        レスポンス生成用の最近のチャットコンテキストを取得
        
        Args:
            auth0_user_id: Auth0ユーザーID
            project_uuid: プロジェクトUUID
            context_limit: コンテキストに含める最近のメッセージ数
            
        Returns:
            最近のProjectChatインスタンスのリスト
            
        Raises:
            UserNotFoundError: ユーザーが見つからない場合
            ProjectNotFoundError: プロジェクトが見つからない場合
            ChatHistoryError: コンテキスト取得が失敗した場合
        """
        try:
            logger.info(f"ユーザー {auth0_user_id}、プロジェクト {project_uuid} のチャットコンテキストを取得中")
            
            # Auth0 IDでユーザーを取得
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # UUIDでプロジェクトIDを取得
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # 最近のチャット履歴を取得
            chat_context = self.chat_repo.get_chat_history(
                project_id=str(project_id),
                user_id=str(user.id),
                limit=context_limit
            )
            
            logger.info(f"コンテキスト用に{len(chat_context)}件のメッセージを取得しました")
            return chat_context
            
        except (UserNotFoundError, ProjectNotFoundError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"チャットコンテキスト取得中の予期せぬエラー: {str(e)}")
            raise ChatHistoryError(
                f"チャットコンテキストの取得に失敗しました: {str(e)}",
                error_code="GET_CHAT_CONTEXT_SERVICE_ERROR"
            )
    
    def clear_chat_history(
        self, 
        auth0_user_id: str, 
        project_uuid: str
    ) -> bool:
        """
        ユーザーとプロジェクトのチャット履歴をクリア
        
        Args:
            auth0_user_id: Auth0ユーザーID
            project_uuid: プロジェクトUUID
            
        Returns:
            チャット履歴がクリアされた場合はTrue、そうでなければFalse
            
        Raises:
            UserNotFoundError: ユーザーが見つからない場合
            ProjectNotFoundError: プロジェクトが見つからない場合
            ChatHistoryError: チャット履歴削除が失敗した場合
        """
        try:
            logger.info(f"ユーザー {auth0_user_id}、プロジェクト {project_uuid} のチャット履歴をクリア中")
            
            # Auth0 IDでユーザーを取得
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # UUIDでプロジェクトIDを取得
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # チャット履歴をクリア
            success = self.chat_repo.delete_chat_history(
                project_id=str(project_id),
                user_id=str(user.id)
            )
            
            if success:
                logger.info(f"チャット履歴を正常にクリアしました")
            else:
                logger.warning(f"クリアするチャット履歴が見つかりませんでした")
            
            return success
            
        except (UserNotFoundError, ProjectNotFoundError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"チャット履歴クリア中の予期せぬエラー: {str(e)}")
            raise ChatHistoryError(
                f"チャット履歴のクリアに失敗しました: {str(e)}",
                error_code="CLEAR_CHAT_HISTORY_SERVICE_ERROR"
            )
    
    def get_user_project_info(
        self, 
        auth0_user_id: str, 
        project_uuid: str
    ) -> tuple[User, Project]:
        """
        ユーザーとプロジェクトの情報を取得
        
        Args:
            auth0_user_id: Auth0ユーザーID
            project_uuid: プロジェクトUUID
            
        Returns:
            (User, Project)インスタンスのタプル
            
        Raises:
            UserNotFoundError: ユーザーが見つからない場合
            ProjectNotFoundError: プロジェクトが見つからない場合
        """
        try:
            logger.info(f"ユーザー {auth0_user_id}、プロジェクト {project_uuid} のユーザーとプロジェクト情報を取得中")
            
            # Auth0 IDでユーザーを取得
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # UUIDでプロジェクトを取得
            project = self.project_repo.get_project_by_uuid(project_uuid)
            if not project:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            logger.info(f"ユーザー {user.id} とプロジェクト {project.id} を取得しました")
            return user, project
            
        except (UserNotFoundError, ProjectNotFoundError):
            raise
        except Exception as e:
            logger.error(f"ユーザーとプロジェクト情報取得中の予期せぬエラー: {str(e)}")
            raise


