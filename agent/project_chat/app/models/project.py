from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

# enum
class ProcedureTypeGroup(str, Enum):
    """入札案件の手続き種別グループ"""
    SHIMEI = "指名競争入札"
    KIKAKU = "企画競争入札"
    ZUII = "随意契約"
    MITSUMORI = "見積もり合わせ"
    SHIRYO = "資料招請"
    IKEN = "意見招請"
    IPPAN = "一般競争入札"
    OTHER = "その他"

class Attachment(BaseModel):
    """添付ファイルのモデル"""
    id: int = Field(description="添付ファイルのID")
    name: str = Field(description="添付ファイルの名前")
    text: Optional[str] = Field(None, description="添付ファイルのテキスト情報")
    url: str = Field(description="添付ファイルのURL")

class Project(BaseModel):
    """公共入札の入札案件のモデル"""
    
    class Config:
        # APIのcamelCaseフィールド名をそのまま使用
        populate_by_name = True
    id: int = Field(description="入札案件のID")
    uuid: str = Field(description="入札案件のUUID")
    title: str = Field(description="入札案件のタイトル")
    description: str = Field(description="入札案件の説明")
    rawTitle: Optional[str] = Field(None, description="入札案件の生タイトル")
    organizationName: str = Field(description="入札案件の発注機関名")
    procedureTypeGroup: str = Field(description="入札案件の入札形式")
    publicationDate: str = Field(description="入札案件の公開日。公告日ともいう。")
    applicationDocumentDeadlineDate: Optional[str] = Field(None, description="応募書類の提出期限日。")
    proposalDocumentDeadlineDate: Optional[str] = Field(None, description="提案書類の提出期限日。")
    biddingDeadlineDate: Optional[str] = Field(None, description="入札案件の入札日。落札日ともいう。")
    registrationDate: str = Field(description="入札案件のLabidに登録された日")
    documentUrl: str = Field(description="入札案件のページURL")
    attachments: list[Attachment] = Field(default_factory=list, description="添付ファイルのリスト")


    def to_json(self):
        return self.model_dump_json(indent=2)

    def to_summary(self):
        # title, description, procedureTypeGroup, publicationDate, applicationDocumentDeadlineDate, proposalDocumentDeadlineDate, biddingDeadlineDate, registrationDate, externalDocumentUrlのみとする
        attachments = [attachment.model_dump_json(indent=2) for attachment in self.attachments]
        summary = {
            "title": self.title,
            "description": self.description,
            "procedureTypeGroup": self.procedureTypeGroup,
            "publicationDate": self.publicationDate,
            "applicationDocumentDeadlineDate": self.applicationDocumentDeadlineDate,
            "proposalDocumentDeadlineDate": self.proposalDocumentDeadlineDate,
            "biddingDeadlineDate": self.biddingDeadlineDate,
            "registrationDate": self.registrationDate,
            "documentUrl": self.documentUrl,
            "attachments": attachments
        }
        return summary