from typing import Optional
from models.user import User
from repository.base import BaseRepository
from core.exceptions import UserNotFoundError, ValidationError
from core.logging import get_logger

logger = get_logger("user_repository")


class UserRepository(BaseRepository[User]):
    """ユーザーリポジトリクラス"""
    
    def __init__(self):
        super().__init__(User)
    
    def _get_table_name(self) -> str:
        """Return the database table name for users"""
        return "users"
    
    def _map_to_model(self, data: dict) -> User:
        """Map database row data to User model instance"""
        return User(**data)
    
    def get_user_by_auth0_id(self, auth0_id: str) -> Optional[User]:
        """
        指定されたAuth0 IDのユーザー情報を取得
        
        Args:
            auth0_id: Auth0 user ID
            
        Returns:
            User instance or None if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Getting user by Auth0 ID: {auth0_id}")
            
            query = "SELECT * FROM users WHERE auth0_user_id = :auth0_id"
            results = self.execute_query(query, {"auth0_id": auth0_id})
            
            if not results:
                logger.debug(f"User not found for Auth0 ID: {auth0_id}")
                return None
            
            user = self._map_to_model(results[0])
            logger.debug(f"User found: {user.id}")
            return user
            
        except Exception as e:
            logger.error(f"Failed to get user by Auth0 ID {auth0_id}: {str(e)}")
            raise
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        指定されたメールアドレスのユーザー情報を取得
        
        Args:
            email: User email address
            
        Returns:
            User instance or None if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Getting user by email: {email}")
            
            query = "SELECT * FROM users WHERE email = :email"
            results = self.execute_query(query, {"email": email})
            
            if not results:
                logger.debug(f"User not found for email: {email}")
                return None
            
            user = self._map_to_model(results[0])
            logger.debug(f"User found: {user.id}")
            return user
            
        except Exception as e:
            logger.error(f"Failed to get user by email {email}: {str(e)}")
            raise
    
    def get_users_by_company_id(self, company_id: int) -> list[User]:
        """
        指定された会社IDのユーザー一覧を取得
        
        Args:
            company_id: Company ID
            
        Returns:
            List of User instances
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            logger.debug(f"Getting users by company ID: {company_id}")
            
            query = "SELECT * FROM users WHERE company_id = :company_id ORDER BY name"
            results = self.execute_query(query, {"company_id": company_id})
            
            users = [self._map_to_model(row) for row in results]
            logger.debug(f"Found {len(users)} users for company {company_id}")
            return users
            
        except Exception as e:
            logger.error(f"Failed to get users by company ID {company_id}: {str(e)}")
            raise
    
    def create_user(self, user_data: dict) -> User:
        """
        新しいユーザーを作成
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Created User instance
            
        Raises:
            DatabaseError: If creation fails
            ValidationError: If data validation fails
        """
        try:
            logger.debug(f"Creating new user with email: {user_data.get('email')}")
            
            # Validate required fields
            required_fields = ['email', 'name', 'auth0_user_id']
            for field in required_fields:
                if field not in user_data:
                    raise ValidationError(f"Required field '{field}' is missing")
            
            # Check if user already exists
            existing_user = self.get_user_by_auth0_id(user_data['auth0_user_id'])
            if existing_user:
                raise ValidationError(f"User with Auth0 ID {user_data['auth0_user_id']} already exists")
            
            existing_user = self.get_user_by_email(user_data['email'])
            if existing_user:
                raise ValidationError(f"User with email {user_data['email']} already exists")
            
            created_user = self.create(user_data)
            logger.info(f"User created successfully: {created_user.id}")
            return created_user
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            raise
    
    def update_user(self, user_id: int, user_data: dict) -> Optional[User]:
        """
        ユーザー情報を更新
        
        Args:
            user_id: User ID
            user_data: Updated user data
            
        Returns:
            Updated User instance or None if not found
            
        Raises:
            DatabaseError: If update fails
            ValidationError: If data validation fails
        """
        try:
            logger.debug(f"Updating user: {user_id}")
            
            # Check if user exists
            if not self.exists(user_id):
                logger.warning(f"User not found for update: {user_id}")
                return None
            
            # If email is being updated, check for duplicates
            if 'email' in user_data:
                existing_user = self.get_user_by_email(user_data['email'])
                if existing_user and existing_user.id != user_id:
                    raise ValidationError(f"User with email {user_data['email']} already exists")
            
            updated_user = self.update(user_id, user_data)
            if updated_user:
                logger.info(f"User updated successfully: {user_id}")
            return updated_user
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {str(e)}")
            raise
    
    def delete_user(self, user_id: int) -> bool:
        """
        ユーザーを削除
        
        Args:
            user_id: User ID
            
        Returns:
            True if user was deleted, False if not found
            
        Raises:
            DatabaseError: If deletion fails
        """
        try:
            logger.debug(f"Deleting user: {user_id}")
            
            success = self.delete(user_id)
            if success:
                logger.info(f"User deleted successfully: {user_id}")
            else:
                logger.warning(f"User not found for deletion: {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {str(e)}")
            raise

