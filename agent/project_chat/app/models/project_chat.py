from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ChatRole(str, Enum):
    """チャットロール"""
    SYSTEM = "system"
    USER = "user"

class ProjectChat(BaseModel):
    """ プロジェクトチャットの情報 """
    id: Optional[int] = Field(default=None, description="チャットメッセージID")
    user_id: int = Field(description="ユーザーのID")
    project_id: int = Field(description="プロジェクトのID")
    role: ChatRole = Field(description="チャットの役割")
    value: str = Field(description="チャットのテキスト")
    created_at: datetime = Field(description="チャットの作成日時")
    updated_at: Optional[datetime] = Field(default=None, description="チャットの更新日時")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="追加メタデータ")

    # from json
    @classmethod
    def from_json(cls, json_data: dict) -> "ProjectChat":
        return cls(
            id=json_data.get("id"),
            user_id=json_data["user_id"],
            project_id=json_data["project_id"],
            role=ChatRole(json_data["role"]),
            value=str(json_data["value"]),
            created_at=json_data["created_at"],
            updated_at=json_data.get("updated_at"),
            metadata=json_data.get("metadata"),
        )

    @property
    def message(self) -> str:
        return self.value

    @property
    def is_user_message(self) -> bool:
        return self.role == ChatRole.USER

    def to_summary(self):
        return {
            "role": self.role.value,
            "value": self.value,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else str(self.created_at)
        }
