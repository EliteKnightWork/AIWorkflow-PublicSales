"""
リポジトリの集中インスタンス化と依存性注入のためのリポジトリファクトリー
"""
from typing import Dict, Type, Any
from repository.base import BaseRepository
from repository.user_repository import UserRepository
from repository.project_repository import ProjectRepository
from repository.chat_history_repository import ChatHistoryRepository
from core.logging import get_logger

logger = get_logger("repository_factory")


class RepositoryFactory:
    """リポジトリインスタンスの作成と管理を行うファクトリークラス"""
    
    def __init__(self):
        self._repositories: Dict[str, BaseRepository] = {}
        logger.info("リポジトリファクトリーを初期化しました")
    
    def get_user_repository(self) -> UserRepository:
        """UserRepositoryインスタンスを取得"""
        if 'user' not in self._repositories:
            self._repositories['user'] = UserRepository()
            logger.debug("新しいUserRepositoryインスタンスを作成しました")
        return self._repositories['user']
    
    def get_project_repository(self) -> ProjectRepository:
        """ProjectRepositoryインスタンスを取得"""
        if 'project' not in self._repositories:
            self._repositories['project'] = ProjectRepository()
            logger.debug("新しいProjectRepositoryインスタンスを作成しました")
        return self._repositories['project']
    
    def get_chat_history_repository(self) -> ChatHistoryRepository:
        """ChatHistoryRepositoryインスタンスを取得"""
        if 'project_chat_histories' not in self._repositories:
            self._repositories['project_chat_histories'] = ChatHistoryRepository()
            logger.debug("新しいChatHistoryRepositoryインスタンスを作成しました")
        return self._repositories['project_chat_histories']
    
    def get_repository(self, repository_type: str) -> BaseRepository:
        """
        タイプ別にリポジトリインスタンスを取得
        
        Args:
            repository_type: リポジトリのタイプ ('user', 'project', 'project_chat_histories')
            
        Returns:
            リポジトリインスタンス
            
        Raises:
            ValueError: サポートされていないリポジトリタイプの場合
        """
        repository_map = {
            'user': self.get_user_repository,
            'project': self.get_project_repository,
            'project_chat_histories': self.get_chat_history_repository
        }
        
        if repository_type not in repository_map:
            raise ValueError(f"サポートされていないリポジトリタイプ: {repository_type}")
        
        return repository_map[repository_type]()
    
    def clear_cache(self):
        """キャッシュされたすべてのリポジトリインスタンスをクリア"""
        self._repositories.clear()
        logger.info("リポジトリキャッシュをクリアしました")
    
    def get_all_repositories(self) -> Dict[str, BaseRepository]:
        """キャッシュされたすべてのリポジトリインスタンスを取得"""
        return self._repositories.copy()


# グローバルリポジトリファクトリーインスタンス
_repository_factory = RepositoryFactory()


def get_repository_factory() -> RepositoryFactory:
    """グローバルリポジトリファクトリーインスタンスを取得"""
    return _repository_factory


def get_user_repository() -> UserRepository:
    """UserRepositoryを取得する便利関数"""
    return _repository_factory.get_user_repository()


def get_project_repository() -> ProjectRepository:
    """ProjectRepositoryを取得する便利関数"""
    return _repository_factory.get_project_repository()


def get_chat_history_repository() -> ChatHistoryRepository:
    """ChatHistoryRepositoryを取得する便利関数"""
    return _repository_factory.get_chat_history_repository()


def get_repository(repository_type: str) -> BaseRepository:
    """タイプ別にリポジトリを取得する便利関数"""
    return _repository_factory.get_repository(repository_type)
