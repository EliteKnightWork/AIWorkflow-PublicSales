"""
依存性注入のためのインターフェース定義
"""
from .chat_repository_interface import IChatRepository
from .project_repository_interface import IProjectRepository
from .user_repository_interface import IUserRepository
from .chat_agent_interface import IChatAgent

__all__ = [
    "IChatRepository",
    "IProjectRepository", 
    "IUserRepository",
    "IChatAgent"
]
