from typing import Optional
from pydantic import BaseModel, Field


class User(BaseModel):
    """ユーザーのモデル"""

    id: int = Field(description="ユーザーのID")
    email: str = Field(description="ユーザーのメールアドレス")
    name: Optional[str] = Field(default=None, description="ユーザーの名前")
    auth0_user_id: str = Field(description="ユーザーのAuth0 ID")
    company_id: Optional[int] = Field(default=None, description="ユーザーの会社ID")

    def to_json(self) -> str:
        return self.model_dump_json(indent=2)

    
