from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

# enum
class CompanyFeature(str, Enum):
    """会社の追加機能"""
    AI_CHAT = "ai_chat"
    PROPOSAL_DOCUMENT_CREATE = "proposal_document_create"


class Company(BaseModel):
    """会社モデル（プラン情報を含む）"""
    id: int = Field(description="会社ID")
    name: str = Field(description="会社名")
    features: list[CompanyFeature] = Field(default_factory=list, description="会社の追加機能")

    def to_json(self):
        return self.model_dump_json(indent=2)


