from typing import Optional, List
from datetime import datetime
from sqlalchemy import text
from models.project_chat import ChatRole, ProjectChat
from repository.base import BaseRepository
from core.exceptions import ChatHistoryError, ValidationError
from core.logging import get_logger

logger = get_logger("chat_history_repository")


class ChatHistoryRepository(BaseRepository[ProjectChat]):
    """チャット履歴リポジトリクラス"""
    
    def __init__(self):
        super().__init__(ProjectChat)
    
    def _get_table_name(self) -> str:
        """Return the database table name for project chat history"""
        return "project_chat_histories"
    
    def _map_to_model(self, data: dict) -> ProjectChat:
        """Map database row data to ProjectChat model instance"""
        return ProjectChat(
            id=data.get("id"),
            user_id=data["user_id"],
            project_id=data["project_id"],
            role=ChatRole(data["role"]),
            value=str(data["value"]),
            created_at=data["created_at"],
            updated_at=data.get("updated_at")
        )
    
    def get_chat_history(self, project_id: str, user_id: str, limit: int = 10, offset: int = 0) -> List[ProjectChat]:
        """
        指定された案件IDのユーザーIDの最新のチャット履歴を取得する
        """
        try:
            if not project_id or not user_id:
                raise ValidationError("Project ID and User ID cannot be empty")
            
            if limit <= 0:
                raise ValidationError("Limit must be greater than 0")
            
            if offset < 0:
                raise ValidationError("Offset must be greater than or equal to 0")

            logger.debug(
                f"Getting chat history for project {project_id}, user {user_id}, limit {limit}, offset {offset}"
            )
            
            query = """
                SELECT * FROM project_chat_histories 
                WHERE user_id = :user_id AND project_id = :project_id 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset
            """
            
            results = self.execute_query(query, {
                "user_id": int(user_id),
                "project_id": int(project_id),
                "limit": limit,
                "offset": offset
            })
            
            chat_history = [self._map_to_model(row) for row in results]
            logger.debug(f"Found {len(chat_history)} chat history records")
            return chat_history
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to get chat history: {str(e)}")
            raise ChatHistoryError(
                f"Failed to get chat history: {str(e)}",
                error_code="GET_CHAT_HISTORY_ERROR"
            )
    
    def add_chat(self, project_id: str, user_id: str, role: ChatRole, value: str) -> ProjectChat:
        """
        チャットを追加する
        """
        try:
            if not project_id or not user_id:
                raise ValidationError("Project ID and User ID cannot be empty")
            
            if not value or not value.strip():
                raise ValidationError("Chat value cannot be empty")
            
            if not isinstance(role, ChatRole):
                raise ValidationError("Invalid chat role")
            
            logger.debug(f"Adding chat for project {project_id}, user {user_id}, role {role.value}")
            
            created_at = datetime.utcnow()
            updated_at = created_at
            
            chat_data = {
                "user_id": int(user_id),
                "project_id": int(project_id),
                "role": role.value,
                "value": value.strip(),
                "created_at": created_at,
                "updated_at": updated_at
            }
            
            # Use transaction to ensure data consistency
            with self.transaction() as session:
                query = """
                    INSERT INTO project_chat_histories (user_id, project_id, role, value, created_at, updated_at)
                    VALUES (:user_id, :project_id, :role, :value, :created_at, :updated_at)
                """
                
                result = session.execute(text(query), chat_data)
                affected_rows = result.rowcount
                
                if affected_rows == 0:
                    raise ChatHistoryError(
                        "No rows were affected during chat creation",
                        error_code="CHAT_CREATE_NO_ROWS_AFFECTED"
                    )
                
                new_id_result = session.execute(text("SELECT LAST_INSERT_ID()"))
                new_id = new_id_result.scalar() if new_id_result else None
                if new_id is not None:
                    new_id = int(new_id)
                created_chat = ProjectChat(
                    id=new_id,
                    user_id=int(user_id),
                    project_id=int(project_id),
                    role=role,
                    value=value.strip(),
                    created_at=created_at,
                    updated_at=updated_at
                )
                
                logger.info(f"Chat added successfully for project {project_id}, user {user_id}")
                return created_chat
                
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to add chat: {str(e)}")
            raise ChatHistoryError(
                f"Failed to add chat: {str(e)}",
                error_code="ADD_CHAT_ERROR"
            )
    
    def get_chat_history_by_date_range(
        self, 
        project_id: str, 
        user_id: str, 
        start_date: str, 
        end_date: str,
        limit: Optional[int] = None
    ) -> List[ProjectChat]:
        """
        指定された日付範囲のチャット履歴を取得する
        """
        try:
            if not all([project_id, user_id, start_date, end_date]):
                raise ValidationError("All parameters are required")
            
            logger.debug(f"Getting chat history by date range for project {project_id}, user {user_id}")
            
            query = """
                SELECT * FROM project_chat_histories 
                WHERE user_id = :user_id AND project_id = :project_id 
                AND created_at >= :start_date AND created_at <= :end_date
                ORDER BY created_at DESC
            """
            
            params = {
                "user_id": int(user_id),
                "project_id": int(project_id),
                "start_date": start_date,
                "end_date": end_date
            }
            
            if limit:
                query += " LIMIT :limit"
                params["limit"] = limit
            
            results = self.execute_query(query, params)
            chat_history = [self._map_to_model(row) for row in results]
            
            logger.debug(f"Found {len(chat_history)} chat history records in date range")
            return chat_history
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to get chat history by date range: {str(e)}")
            raise ChatHistoryError(
                f"Failed to get chat history by date range: {str(e)}",
                error_code="GET_CHAT_HISTORY_BY_DATE_ERROR"
            )
    
    def get_chat_count(self, project_id: str, user_id: str) -> int:
        """
        指定されたプロジェクトとユーザーのチャット数を取得する
        """
        try:
            if not project_id or not user_id:
                raise ValidationError("Project ID and User ID cannot be empty")
            
            logger.debug(f"Getting chat count for project {project_id}, user {user_id}")
            
            query = """
                SELECT COUNT(*) as count FROM project_chat_histories 
                WHERE user_id = :user_id AND project_id = :project_id
            """
            
            results = self.execute_query(query, {
                "user_id": int(user_id),
                "project_id": int(project_id)
            })
            
            count = results[0]['count'] if results else 0
            logger.debug(f"Chat count: {count}")
            return count
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to get chat count: {str(e)}")
            raise ChatHistoryError(
                f"Failed to get chat count: {str(e)}",
                error_code="GET_CHAT_COUNT_ERROR"
            )
    
    def delete_chat_history(self, project_id: str, user_id: str) -> bool:
        """
        指定されたプロジェクトとユーザーのチャット履歴を削除する
        """
        try:
            if not project_id or not user_id:
                raise ValidationError("Project ID and User ID cannot be empty")
            
            logger.debug(f"Deleting chat history for project {project_id}, user {user_id}")
            
            query = """
                DELETE FROM project_chat_histories 
                WHERE user_id = :user_id AND project_id = :project_id
            """
            
            affected_rows = self.execute_update(query, {
                "user_id": user_id,
                "project_id": project_id
            })
            
            success = affected_rows > 0
            if success:
                logger.info(f"Deleted {affected_rows} chat history records")
            else:
                logger.warning("No chat history records found to delete")
            
            return success
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to delete chat history: {str(e)}")
            raise ChatHistoryError(
                f"Failed to delete chat history: {str(e)}",
                error_code="DELETE_CHAT_HISTORY_ERROR"
            )
    
    def get_latest_chat(self, project_id: str, user_id: str) -> Optional[ProjectChat]:
        """
        指定されたプロジェクトとユーザーの最新のチャットを取得する
        """
        try:
            if not project_id or not user_id:
                raise ValidationError("Project ID and User ID cannot be empty")
            
            logger.debug(f"Getting latest chat for project {project_id}, user {user_id}")
            
            query = """
                SELECT * FROM project_chat_histories 
                WHERE user_id = :user_id AND project_id = :project_id 
                ORDER BY created_at DESC 
                LIMIT 1
            """
            
            results = self.execute_query(query, {
                "user_id": int(user_id),
                "project_id": int(project_id)
            })
            
            if not results:
                logger.debug("No chat history found")
                return None
            
            latest_chat = self._map_to_model(results[0])
            logger.debug(f"Latest chat found: {latest_chat.created_at}")
            return latest_chat
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to get latest chat: {str(e)}")
            raise ChatHistoryError(
                f"Failed to get latest chat: {str(e)}",
                error_code="GET_LATEST_CHAT_ERROR"
            )
