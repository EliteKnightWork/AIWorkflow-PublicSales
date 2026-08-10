"""
チャットサービス - ビジネスロジック層
依存性注入を使用したチャット処理のためのサービス層パターンを実装
"""
import logging
from typing import AsyncGenerator, List, Optional

from models.project_chat import ProjectChat, ChatRole
from models.user import User
from models.project import Project
from interfaces import IChatRepository, IProjectRepository, IUserRepository, IChatAgent
from core.exceptions import (
    ValidationError,
    UserNotFoundError,
    ProjectNotFoundError,
    ChatHistoryError,
    LLMError
)

logger = logging.getLogger(__name__)


class ChatService:
    """
    依存性注入を使用してチャットビジネスロジックを処理するサービスクラス
    """
    
    def __init__(
        self,
        chat_repo: IChatRepository,
        project_repo: IProjectRepository,
        user_repo: IUserRepository,
        chat_agent: Optional[IChatAgent] = None
    ):
        """
        注入された依存性でChatServiceを初期化
        
        Args:
            chat_repo: チャットリポジトリインターフェース
            project_repo: プロジェクトリポジトリインターフェース
            user_repo: ユーザーリポジトリインターフェース
            chat_agent: チャットエージェントインターフェース（オプション、ストリーミング時のみ必要）
        """
        self.chat_repo = chat_repo
        self.project_repo = project_repo
        self.user_repo = user_repo
        self._chat_agent = chat_agent
        
        logger.info("依存性注入でChatServiceを初期化しました")
    
    @property
    def chat_agent(self) -> IChatAgent:
        """
        チャットエージェントを取得（遅延初期化）
        ストリーミング処理時のみ必要
        """
        if self._chat_agent is None:
            raise LLMError(
                "チャットエージェントが利用できません。ストリーミング操作にはget_chat_service_with_agent()を使用してください。",
                error_code="CHAT_AGENT_NOT_AVAILABLE"
            )
        return self._chat_agent
    
    def process_chat_stream(
        self,
        project_uuid: str,
        auth0_user_id: str,
        message: str
    ):
        """
        チャットメッセージを処理してストリーミングレスポンスを返す
        
        Args:
            project_uuid: プロジェクトUUID
            auth0_user_id: Auth0ユーザーID
            message: ユーザーメッセージ
            
        Yields:
            str: ストリーミングレスポンスチャンク
            
        Raises:
            ValidationError: 無効な入力パラメータ
            UserNotFoundError: ユーザーが見つからない
            ProjectNotFoundError: プロジェクトが見つからない
            ChatHistoryError: チャット履歴操作が失敗
            LLMError: LLM処理が失敗
        """
        try:
            logger.info(f"プロジェクト {project_uuid}、ユーザー {auth0_user_id} のチャットストリームを処理中")
            
            # 入力値を検証
            if not message or not message.strip():
                raise ValidationError("メッセージは空にできません")
            
            if not project_uuid or not project_uuid.strip():
                raise ValidationError("プロジェクトUUIDは空にできません")
            
            if not auth0_user_id or not auth0_user_id.strip():
                raise ValidationError("Auth0ユーザーIDは空にできません")
            
            # ユーザーを取得して検証
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # プロジェクトを取得して検証
            project = self.project_repo.get_project_by_uuid(project_uuid)
            if not project:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # コンテキスト用のチャット履歴を取得
            chat_history = self.chat_repo.get_chat_history(
                project_id=str(project.id),
                user_id=str(user.id),
                limit=10
            )
            
            # ユーザーメッセージを保存
            user_message = self.chat_repo.add_chat(
                project_id=str(project.id),
                user_id=str(user.id),
                role=ChatRole.USER,
                value=message.strip()
            )
            
            logger.info(f"ユーザーメッセージを正常に保存しました")
            
            # エージェントで処理してストリーミングレスポンス
            response_text = ""
            try:
                # ストリーミング用の既存チャットエージェントを使用
                agent = self.chat_agent
                for chunk, metadata in agent.chat(project_uuid, message, chat_history, project):
                    if hasattr(chunk, 'content') and chunk.content:
                        text = chunk.content
                    elif isinstance(chunk, dict) and "output_text" in chunk:
                        text = chunk["output_text"]
                    elif hasattr(chunk, "content"):
                        text = chunk.content
                    else:
                        text = str(chunk)
                    
                    response_text += text
                    yield text
                
                # エージェントレスポンスを保存
                if response_text:
                    system_message = self.chat_repo.add_chat(
                        project_id=str(project.id),
                        user_id=str(user.id),
                        role=ChatRole.SYSTEM,
                        value=response_text
                    )
                    logger.info(f"システムメッセージを保存しました")
                
            except Exception as e:
                logger.error(f"チャット処理中のエラー: {str(e)}")
                error_message = "申し訳ございません。処理途中にエラーが発生しました。"
                
                # エラーメッセージを保存
                self.chat_repo.add_chat(
                    project_id=str(project.id),
                    user_id=str(user.id),
                    role=ChatRole.SYSTEM,
                    value=error_message
                )
                
                yield error_message
                raise LLMError(f"チャット処理が失敗しました: {str(e)}")
            
        except (ValidationError, UserNotFoundError, ProjectNotFoundError, ChatHistoryError, LLMError):
            # 既知の例外を再発生
            raise
        except Exception as e:
            logger.error(f"チャット処理中の予期しないエラー: {str(e)}", exc_info=True)
            raise ChatHistoryError(f"チャット処理中の予期しないエラー: {str(e)}")
    
    def get_chat_history(
        self,
        project_uuid: str,
        auth0_user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[ProjectChat]:
        """
        プロジェクトとユーザーのチャット履歴を取得
        
        Args:
            project_uuid: プロジェクトUUID
            auth0_user_id: Auth0ユーザーID
            limit: 返すメッセージの最大数
            
        Returns:
            ProjectChatメッセージのリスト
            
        Raises:
            ValidationError: 無効な入力パラメータ
            UserNotFoundError: ユーザーが見つからない
            ProjectNotFoundError: プロジェクトが見つからない
            ChatHistoryError: チャット履歴操作が失敗
        """
        try:
            logger.info(f"プロジェクト {project_uuid}、ユーザー {auth0_user_id} のチャット履歴を取得中")
            
            # 入力値を検証
            if not project_uuid or not project_uuid.strip():
                raise ValidationError("プロジェクトUUIDは空にできません")
            
            if not auth0_user_id or not auth0_user_id.strip():
                raise ValidationError("Auth0ユーザーIDは空にできません")
            
            # ユーザーを取得して検証
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # プロジェクトを取得して検証
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            if offset < 0:
                raise ValidationError("Offset must be greater than or equal to 0")

            # チャット履歴を取得
            chat_history = self.chat_repo.get_chat_history(
                project_id=str(project_id),
                user_id=str(user.id),
                limit=limit,
                offset=offset
            )
            
            logger.info(f"{len(chat_history)}件のチャットメッセージを取得しました")
            return chat_history
            
        except (ValidationError, UserNotFoundError, ProjectNotFoundError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"チャット履歴取得中の予期しないエラー: {str(e)}", exc_info=True)
            raise ChatHistoryError(f"チャット履歴の取得に失敗しました: {str(e)}")
    
    def clear_chat_history(
        self,
        project_uuid: str,
        auth0_user_id: str
    ) -> bool:
        """
        プロジェクトとユーザーのチャット履歴をクリア
        
        Args:
            project_uuid: プロジェクトUUID
            auth0_user_id: Auth0ユーザーID
            
        Returns:
            履歴がクリアされた場合はTrue、そうでなければFalse
            
        Raises:
            ValidationError: 無効な入力パラメータ
            UserNotFoundError: ユーザーが見つからない
            ProjectNotFoundError: プロジェクトが見つからない
            ChatHistoryError: チャット履歴操作が失敗
        """
        try:
            logger.info(f"プロジェクト {project_uuid}、ユーザー {auth0_user_id} のチャット履歴をクリア中")
            
            # 入力値を検証
            if not project_uuid or not project_uuid.strip():
                raise ValidationError("プロジェクトUUIDは空にできません")
            
            if not auth0_user_id or not auth0_user_id.strip():
                raise ValidationError("Auth0ユーザーIDは空にできません")
            
            # ユーザーを取得して検証
            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")
            
            # プロジェクトを取得して検証
            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")
            
            # チャット履歴をクリア
            success = self.chat_repo.delete_chat_history(
                project_id=str(project_id),
                user_id=str(user.id)
            )
            
            if success:
                logger.info("チャット履歴を正常にクリアしました")
            else:
                logger.warning("クリアするチャット履歴が見つかりませんでした")
            
            return success
            
        except (ValidationError, UserNotFoundError, ProjectNotFoundError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"チャット履歴クリア中の予期しないエラー: {str(e)}", exc_info=True)
            raise ChatHistoryError(f"チャット履歴のクリアに失敗しました: {str(e)}")

    def get_chat_history_count(
        self,
        project_uuid: str,
        auth0_user_id: str
    ) -> int:
        """
        指定されたプロジェクトとユーザーのチャットメッセージ数を取得
        """
        try:
            if not project_uuid or not project_uuid.strip():
                raise ValidationError("プロジェクトUUIDは空にできません")

            if not auth0_user_id or not auth0_user_id.strip():
                raise ValidationError("Auth0ユーザーIDは空にできません")

            user = self.user_repo.get_user_by_auth0_id(auth0_user_id)
            if not user:
                raise UserNotFoundError(f"Auth0 ID {auth0_user_id} のユーザーが見つかりません")

            project_id = self.project_repo.get_project_id_by_uuid(project_uuid)
            if not project_id:
                raise ProjectNotFoundError(f"UUID {project_uuid} のプロジェクトが見つかりません")

            count = self.chat_repo.get_chat_count(
                project_id=str(project_id),
                user_id=str(user.id)
            )

            return count

        except (ValidationError, UserNotFoundError, ProjectNotFoundError, ChatHistoryError):
            raise
        except Exception as e:
            logger.error(f"チャット履歴件数取得中の予期しないエラー: {str(e)}", exc_info=True)
            raise ChatHistoryError(f"チャット履歴件数の取得に失敗しました: {str(e)}")