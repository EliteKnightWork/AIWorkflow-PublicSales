"""
依存性注入用のチャットエージェントインターフェース
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List
from models.project_chat import ProjectChat
from models.project import Project


class IChatAgent(ABC):
    """チャットエージェント操作のインターフェース"""
    
    @abstractmethod
    def chat(self, uuid: str, input_text: str, chat_history: List[ProjectChat], project: Project = None):
        """チャットを処理してストリーミングレスポンスを返す"""
        pass
    
    @abstractmethod
    async def stream_response(self, project_uuid: str, message: str, history: List[ProjectChat]) -> AsyncGenerator[str, None]:
        """チャットレスポンスを非同期でストリーミング"""
        pass
