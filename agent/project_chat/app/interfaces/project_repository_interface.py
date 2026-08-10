"""
依存性注入用のプロジェクトリポジトリインターフェース
"""
from abc import ABC, abstractmethod
from typing import Optional
from models.project import Project


class IProjectRepository(ABC):
    """プロジェクトリポジトリ操作のインターフェース"""
    
    @abstractmethod
    def get_project_by_uuid(self, uuid: str) -> Optional[Project]:
        """UUIDでプロジェクトを取得"""
        pass
    
    @abstractmethod
    def get_project_id_by_uuid(self, uuid: str) -> Optional[int]:
        """UUIDでプロジェクトIDを取得"""
        pass
