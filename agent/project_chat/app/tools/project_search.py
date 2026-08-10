from typing import Type
from repository.project_repository import ProjectRepository
from langchain.tools import BaseTool
from pydantic import BaseModel, Field


class ProjectSearchInput(BaseModel):
    uuid: str = Field(description="検索するプロジェクトのuuid")


class ProjectSearchTool(BaseTool):
    name: str = "project_search"
    description: str = "データベースからプロジェクト情報をuuidで検索します。"
    args_schema: Type[BaseModel] = ProjectSearchInput
    
    def _run(self, project_id: str) -> str:
        """project_idでプロジェクトを検索"""
        try:
            repository = ProjectRepository()
            project = repository.get_project_by_id(project_id)
            
            if not project:
                return f"「{project_id}」に一致するプロジェクトが見つかりませんでした。"
            
            return project
            
        except Exception as e:
            return f"ユーザー検索中にエラーが発生しました: {str(e)}"


