"""
依存性注入用のユーザーリポジトリインターフェース
"""
from abc import ABC, abstractmethod
from typing import Optional
from models.user import User


class IUserRepository(ABC):
    """ユーザーリポジトリ操作のインターフェース"""
    
    @abstractmethod
    def get_user_by_auth0_id(self, auth0_id: str) -> Optional[User]:
        """Auth0 IDでユーザーを取得"""
        pass
    
    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """IDでユーザーを取得"""
        pass
