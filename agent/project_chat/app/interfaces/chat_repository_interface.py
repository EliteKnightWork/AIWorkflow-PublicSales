"""
依存性注入用のチャットリポジトリインターフェース
"""
from abc import ABC, abstractmethod
from typing import List
from models.project_chat import ProjectChat, ChatRole


class IChatRepository(ABC):
    """チャットリポジトリ操作のインターフェース"""
    
    @abstractmethod
    def get_chat_history(self, project_id: str, user_id: str, limit: int = 10, offset: int = 0) -> List[ProjectChat]:
        """プロジェクトとユーザーのチャット履歴を取得"""
        pass
    
    @abstractmethod
    def add_chat(self, project_id: str, user_id: str, role: ChatRole, value: str) -> ProjectChat:
        """チャットメッセージを履歴に追加"""
        pass
    
    @abstractmethod
    def delete_chat_history(self, project_id: str, user_id: str) -> bool:
        """プロジェクトとユーザーのチャット履歴を削除"""
        pass
