
import os
import requests
from typing import Optional
from models.project import Project
from repository.base import BaseRepository
from core.exceptions import ProjectNotFoundError, ExternalServiceError, ValidationError
from core.logging import get_logger
from core.config import get_internal_api_config

logger = get_logger("project_repository")


class ProjectRepository(BaseRepository[Project]):
    """プロジェクトリポジトリクラス"""
    
    def __init__(self):
        super().__init__(Project)
        self.api_config = get_internal_api_config()
        self.api_endpoint = self.api_config.endpoint
        self.api_key = self.api_config.api_key
        
        if not self.api_endpoint:
            raise ValidationError("INTERNAL_API_ENDPOINT environment variable is not set")
        
        if not self.api_key:
            raise ValidationError("INTERNAL_API_KEY environment variable is not set")
    
    def _get_table_name(self) -> str:
        """Return the database table name for projects"""
        return "projects"
    
    def _map_to_model(self, data: dict) -> Project:
        """Map database row data to Project model instance"""
        # Handle attachments if present
        if 'attachments' in data and isinstance(data['attachments'], str):
            # If attachments is stored as JSON string, parse it
            import json
            try:
                data['attachments'] = json.loads(data['attachments'])
            except json.JSONDecodeError:
                data['attachments'] = []
        
        return Project(**data)
    
    def get_project_by_uuid(self, uuid: str) -> Optional[Project]:
        """
        指定されたUUIDのプロジェクト情報を取得(外部API経由)
        
        Args:
            uuid: Project UUID
            
        Returns:
            Project instance or None if not found
            
        Raises:
            ExternalServiceError: If external API call fails
            ValidationError: If UUID is invalid
        """
        try:
            if not uuid:
                raise ValidationError("UUID cannot be empty")
            
            logger.debug(f"Getting project by UUID from external API: {uuid}")
            
            url = f"{self.api_endpoint}/v1/internal/projects/{uuid}"
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json"
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            project = Project(**response.json())
            return project
        except requests.RequestException as e:
            # エラーハンドリング(必要に応じてログ出力など)
            return None

    def get_project_id_by_uuid(self, uuid: str):
        """
        指定されたUUIDのプロジェクトIDを取得
        
        Args:
            uuid: Project UUID
            
        Returns:
            Project ID or None if not found
            
        Raises:
            ExternalServiceError: If external API call fails
            ValidationError: If UUID is invalid
        """
        try:
            if not uuid:
                raise ValidationError("UUID cannot be empty")
            
            logger.debug(f"Getting project by UUID from external API: {uuid}")
            
            url = f"{self.api_endpoint}/v1/internal/projects/{uuid}"
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json"
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            project_data = response.json()
            project = Project(**project_data)
            
            logger.debug(f"Project found: {project.id}")
            return project.id
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout while fetching project {uuid}")
            raise ExternalServiceError(
                f"Timeout while fetching project from external API",
                error_code="EXTERNAL_API_TIMEOUT"
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed while fetching project {uuid}: {str(e)}")
            raise ExternalServiceError(
                f"Failed to fetch project from external API: {str(e)}",
                error_code="EXTERNAL_API_ERROR"
            )
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error while fetching project {uuid}: {str(e)}")
            raise ExternalServiceError(
                f"Unexpected error while fetching project: {str(e)}",
                error_code="EXTERNAL_API_UNEXPECTED_ERROR"
            )
    
    def get_project_by_id(self, project_id: int) -> Optional[Project]:
        """
        指定されたIDのプロジェクト情報を取得(データベース経由)
        
        Args:
            project_id: Project ID
            
        Returns:
            Project instance or None if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Getting project by ID: {project_id}")
            
            project = self.find_by_id(project_id)
            if project:
                logger.debug(f"Project found: {project.uuid}")
            else:
                logger.debug(f"Project not found for ID: {project_id}")
            
            return project
            
        except Exception as e:
            logger.error(f"Failed to get project by ID {project_id}: {str(e)}")
            raise
    
    def get_projects_by_organization(self, organization_name: str, limit: Optional[int] = None) -> list[Project]:
        """
        指定された発注機関のプロジェクト一覧を取得
        
        Args:
            organization_name: Organization name
            limit: Maximum number of projects to return
            
        Returns:
            List of Project instances
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Getting projects by organization: {organization_name}")
            
            query = "SELECT * FROM projects WHERE organizationName = :organization_name ORDER BY publicationDate DESC"
            if limit:
                query += f" LIMIT {limit}"
            
            results = self.execute_query(query, {"organization_name": organization_name})
            projects = [self._map_to_model(row) for row in results]
            
            logger.debug(f"Found {len(projects)} projects for organization {organization_name}")
            return projects
            
        except Exception as e:
            logger.error(f"Failed to get projects by organization {organization_name}: {str(e)}")
            raise
    
    def get_projects_by_procedure_type(self, procedure_type: str, limit: Optional[int] = None) -> list[Project]:
        """
        指定された入札形式のプロジェクト一覧を取得
        
        Args:
            procedure_type: Procedure type group
            limit: Maximum number of projects to return
            
        Returns:
            List of Project instances
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Getting projects by procedure type: {procedure_type}")
            
            query = "SELECT * FROM projects WHERE procedureTypeGroup = :procedure_type ORDER BY publicationDate DESC"
            if limit:
                query += f" LIMIT {limit}"
            
            results = self.execute_query(query, {"procedure_type": procedure_type})
            projects = [self._map_to_model(row) for row in results]
            
            logger.debug(f"Found {len(projects)} projects for procedure type {procedure_type}")
            return projects
            
        except Exception as e:
            logger.error(f"Failed to get projects by procedure type {procedure_type}: {str(e)}")
            raise
    
    def search_projects(self, search_term: str, limit: Optional[int] = None) -> list[Project]:
        """
        プロジェクトを検索(タイトルと説明で検索)
        
        Args:
            search_term: Search term
            limit: Maximum number of projects to return
            
        Returns:
            List of matching Project instances
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Searching projects with term: {search_term}")
            
            query = """
                SELECT * FROM projects 
                WHERE title LIKE :search_term OR description LIKE :search_term
                ORDER BY publicationDate DESC
            """
            if limit:
                query += f" LIMIT {limit}"
            
            search_pattern = f"%{search_term}%"
            results = self.execute_query(query, {"search_term": search_pattern})
            projects = [self._map_to_model(row) for row in results]
            
            logger.debug(f"Found {len(projects)} projects matching '{search_term}'")
            return projects
            
        except Exception as e:
            logger.error(f"Failed to search projects with term '{search_term}': {str(e)}")
            raise
    
    def create_project(self, project_data: dict) -> Project:
        """
        新しいプロジェクトを作成
        
        Args:
            project_data: Project data dictionary
            
        Returns:
            Created Project instance
            
        Raises:
            DatabaseError: If creation fails
            ValidationError: If data validation fails
        """
        try:
            logger.debug(f"Creating new project with UUID: {project_data.get('uuid')}")
            
            # Validate required fields
            required_fields = ['uuid', 'title', 'description', 'organizationName', 'procedureTypeGroup', 'publicationDate', 'registrationDate', 'documentUrl']
            for field in required_fields:
                if field not in project_data:
                    raise ValidationError(f"Required field '{field}' is missing")
            
            # Check if project already exists
            existing_project = self.get_project_id_by_uuid(project_data['uuid'])
            if existing_project:
                raise ValidationError(f"Project with UUID {project_data['uuid']} already exists")
            
            # Handle attachments serialization
            if 'attachments' in project_data and isinstance(project_data['attachments'], list):
                import json
                project_data['attachments'] = json.dumps(project_data['attachments'])
            
            created_project = self.create(project_data)
            logger.info(f"Project created successfully: {created_project.id}")
            return created_project
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to create project: {str(e)}")
            raise
    
    def update_project(self, project_id: int, project_data: dict) -> Optional[Project]:
        """
        プロジェクト情報を更新
        
        Args:
            project_id: Project ID
            project_data: Updated project data
            
        Returns:
            Updated Project instance or None if not found
            
        Raises:
            DatabaseError: If update fails
            ValidationError: If data validation fails
        """
        try:
            logger.debug(f"Updating project: {project_id}")
            
            # Check if project exists
            if not self.exists(project_id):
                logger.warning(f"Project not found for update: {project_id}")
                return None
            
            # Handle attachments serialization
            if 'attachments' in project_data and isinstance(project_data['attachments'], list):
                import json
                project_data['attachments'] = json.dumps(project_data['attachments'])
            
            updated_project = self.update(project_id, project_data)
            if updated_project:
                logger.info(f"Project updated successfully: {project_id}")
            return updated_project
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to update project {project_id}: {str(e)}")
            raise
