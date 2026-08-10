"""
依存性注入用のサービスコンテナ
"""
from typing import Optional
from services.chat_service import ChatService
from interfaces import IChatRepository, IProjectRepository, IUserRepository, IChatAgent
from repository.chat_history_repository import ChatHistoryRepository
from repository.project_repository import ProjectRepository
from repository.user_repository import UserRepository
from agents.chat_agent import ChatAgent


class ServiceContainer:
    """
    サービス依存性を管理する依存性注入コンテナ
    """
    
    def __init__(self):
        # ChatAgentとChatServiceはリクエストごとに新しく作成するため、キャッシュしない
        self._chat_repo: Optional[IChatRepository] = None
        self._project_repo: Optional[IProjectRepository] = None
        self._user_repo: Optional[IUserRepository] = None
    
    def get_chat_repository(self) -> IChatRepository:
        """チャットリポジトリインスタンスを取得"""
        if self._chat_repo is None:
            self._chat_repo = ChatHistoryRepository()
        return self._chat_repo
    
    def get_project_repository(self) -> IProjectRepository:
        """プロジェクトリポジトリインスタンスを取得"""
        if self._project_repo is None:
            self._project_repo = ProjectRepository()
        return self._project_repo
    
    def get_user_repository(self) -> IUserRepository:
        """ユーザーリポジトリインスタンスを取得"""
        if self._user_repo is None:
            self._user_repo = UserRepository()
        return self._user_repo
    
    def get_chat_agent(self) -> IChatAgent:
        """チャットエージェントインスタンスを取得（リクエストごとに新しいインスタンスを作成）"""
        # スレッドセーフティのため、リクエストごとに新しいChatAgentインスタンスを作成
        # 既存のシングルトンパターンは、並行ストリーミングセッションで問題を引き起こす可能性がある
        return ChatAgent(stream=True)
    
    def get_chat_service(self) -> ChatService:
        """注入された依存性でチャットサービスインスタンスを取得（ChatAgentなし、履歴操作用）"""
        # チャット履歴の取得・クリア操作ではChatAgentは不要
        return ChatService(
            chat_repo=self.get_chat_repository(),
            project_repo=self.get_project_repository(),
            user_repo=self.get_user_repository()
        )
    
    def get_chat_service_with_agent(self) -> ChatService:
        """注入された依存性でチャットサービスインスタンスを取得（ChatAgentあり、ストリーミング用）"""
        # ストリーミング処理ではChatAgentが必要
        return ChatService(
            chat_repo=self.get_chat_repository(),
            project_repo=self.get_project_repository(),
            user_repo=self.get_user_repository(),
            chat_agent=self.get_chat_agent()
        )


# グローバルコンテナインスタンス
container = ServiceContainer()
