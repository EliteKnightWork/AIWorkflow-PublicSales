"""
共通CRUD操作、トランザクション処理、エラーハンドリングを提供するベースリポジトリクラス
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, TypeVar, Generic
from contextlib import contextmanager
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.connection import db_manager
from core.exceptions import DatabaseError, ValidationError
from core.logging import get_logger

T = TypeVar('T')

logger = get_logger("base")


class TransactionManager:
    """適切なエラーハンドリングとロールバックでデータベーストランザクションを管理"""
    
    def __init__(self, session: Session):
        self.session = session
        self._transaction_active = False
    
    @contextmanager
    def transaction(self):
        """データベーストランザクション用コンテキストマネージャー"""
        if self._transaction_active:
            # ネストされたトランザクション - 既存のセッションをそのまま返す
            yield self.session
        else:
            try:
                self._transaction_active = True
                logger.debug("データベーストランザクションを開始")
                yield self.session
                self.session.commit()
                logger.debug("トランザクションが正常にコミットされました")
            except Exception as e:
                logger.error(f"トランザクションが失敗、ロールバック中: {str(e)}")
                self.session.rollback()
                raise DatabaseError(
                    f"Transaction failed: {str(e)}",
                    error_code="TRANSACTION_ERROR"
                )
            finally:
                self._transaction_active = False
    
    def commit(self):
        """現在のトランザクションを手動でコミット"""
        if self._transaction_active:
            self.session.commit()
            logger.debug("トランザクションが手動でコミットされました")
    
    def rollback(self):
        """現在のトランザクションを手動でロールバック"""
        if self._transaction_active:
            self.session.rollback()
            logger.debug("トランザクションが手動でロールバックされました")


class BaseRepository(ABC, Generic[T]):
    """
    共通CRUD操作とトランザクション処理を提供するベースリポジトリクラス
    """
    
    def __init__(self, model_class: Type[T]):
        self.model_class = model_class
        self.db_manager = db_manager
        logger.info(f"{self.__class__.__name__}を{model_class.__name__}モデル用に初期化しました")
    
    @contextmanager
    def get_session(self):
        """適切なエラーハンドリングでデータベースセッションを取得"""
        try:
            with self.db_manager.get_session() as session:
                yield session
        except Exception as e:
            logger.error(f"データベースセッションの取得に失敗: {str(e)}")
            raise DatabaseError(
                f"Database session error: {str(e)}",
                error_code="SESSION_ERROR"
            )
    
    @contextmanager
    def transaction(self):
        """トランザクション管理付きでデータベースセッションを取得"""
        with self.get_session() as session:
            transaction_manager = TransactionManager(session)
            with transaction_manager.transaction():
                yield session
    
    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        適切なエラーハンドリングでSELECTクエリを実行
        
        Args:
            query: SQLクエリ文字列
            params: クエリパラメータ
            
        Returns:
            クエリ結果を表す辞書のリスト
            
        Raises:
            DatabaseError: クエリ実行が失敗した場合
        """
        try:
            logger.debug(f"クエリを実行中: {query[:100]}...")
            
            with self.get_session() as session:
                if params:
                    result = session.execute(text(query), params).fetchall()
                else:
                    result = session.execute(text(query)).fetchall()
                
                # 辞書のリストに変換
                result_list = []
                for row in result:
                    result_list.append(dict(row._mapping))
                
                logger.debug(f"クエリが正常に実行され、{len(result_list)}行を返しました")
                return result_list
                
        except Exception as e:
            logger.error(f"クエリ実行が失敗: {str(e)}")
            raise DatabaseError(
                f"Query execution failed: {str(e)}",
                error_code="QUERY_ERROR"
            )
    
    def execute_update(self, query: str, params: Optional[Dict[str, Any]] = None) -> int:
        """
        適切なエラーハンドリングでINSERT/UPDATE/DELETEクエリを実行
        
        Args:
            query: SQLクエリ文字列
            params: クエリパラメータ
            
        Returns:
            影響を受けた行数
            
        Raises:
            DatabaseError: クエリ実行が失敗した場合
        """
        try:
            logger.debug(f"更新を実行中: {query[:100]}...")
            
            with self.get_session() as session:
                if params:
                    result = session.execute(text(query), params)
                else:
                    result = session.execute(text(query))
                
                affected_rows = result.rowcount
                logger.debug(f"更新が正常に実行され、{affected_rows}行に影響しました")
                return affected_rows
                
        except Exception as e:
            logger.error(f"更新実行が失敗: {str(e)}")
            raise DatabaseError(
                f"Update execution failed: {str(e)}",
                error_code="UPDATE_ERROR"
            )
    
    def find_by_id(self, id: Any) -> Optional[T]:
        """
        主キーでレコードを検索
        
        Args:
            id: 主キー値
            
        Returns:
            モデルインスタンスまたは見つからない場合はNone
            
        Raises:
            DatabaseError: クエリ実行が失敗した場合
        """
        try:
            # これは汎用的な実装 - サブクラスは特定のモデル用にオーバーライドすべき
            table_name = self._get_table_name()
            query = f"SELECT * FROM {table_name} WHERE id = :id"
            results = self.execute_query(query, {"id": id})
            
            if not results:
                return None
            
            return self._map_to_model(results[0])
            
        except Exception as e:
            logger.error(f"ID {id}での検索に失敗: {str(e)}")
            raise DatabaseError(
                f"ID {id}でのレコード検索に失敗: {str(e)}",
                error_code="FIND_BY_ID_ERROR"
            )
    
    def find_all(self, limit: Optional[int] = None, offset: Optional[int] = None) -> List[T]:
        """
        オプションのページネーション付きで全レコードを検索
        
        Args:
            limit: 返す最大レコード数
            offset: スキップするレコード数
            
        Returns:
            モデルインスタンスのリスト
            
        Raises:
            DatabaseError: クエリ実行が失敗した場合
        """
        try:
            table_name = self._get_table_name()
            query = f"SELECT * FROM {table_name}"
            
            if limit is not None:
                query += f" LIMIT {limit}"
                if offset is not None:
                    query += f" OFFSET {offset}"
            
            results = self.execute_query(query)
            return [self._map_to_model(row) for row in results]
            
        except Exception as e:
            logger.error(f"全レコードの検索に失敗: {str(e)}")
            raise DatabaseError(
                f"全レコードの検索に失敗: {str(e)}",
                error_code="FIND_ALL_ERROR"
            )
    
    def create(self, data: Dict[str, Any]) -> T:
        """
        新しいレコードを作成
        
        Args:
            data: フィールド値を含む辞書
            
        Returns:
            作成されたモデルインスタンス
            
        Raises:
            DatabaseError: 作成が失敗した場合
            ValidationError: データ検証が失敗した場合
        """
        try:
            self._validate_create_data(data)
            
            table_name = self._get_table_name()
            columns = list(data.keys())
            placeholders = [f":{col}" for col in columns]
            
            query = f"""
                INSERT INTO {table_name} ({', '.join(columns)})
                VALUES ({', '.join(placeholders)})
            """
            
            # セッションを使用してINSERTを実行し、生成されたIDを取得
            with self.get_session() as session:
                result = session.execute(text(query), data)
                
                affected_rows = result.rowcount
                
                if affected_rows == 0:
                    raise DatabaseError(
                        "作成中に行が影響を受けませんでした",
                        error_code="CREATE_NO_ROWS_AFFECTED"
                    )
                
                # 生成された主キーを取得
                if 'id' in data:
                    # 手動でIDが指定された場合
                    created_id = data['id']
                else:
                    # 自動増分IDの場合、最後に挿入されたIDを取得
                    try:
                        # MySQLの場合、lastrowidを使用
                        created_id = result.lastrowid
                    except AttributeError:
                        # SQLAlchemyの場合、inserted_primary_keyを使用
                        if hasattr(result, 'inserted_primary_key') and result.inserted_primary_key:
                            created_id = result.inserted_primary_key[0]
                        else:
                            # フォールバック: テーブルから最新のレコードを取得
                            logger.warning("生成されたIDを取得できませんでした。フォールバック方式を使用します。")
                            # この場合は、作成されたデータを直接返すか、サブクラスでオーバーライドが必要
                            return self._create_fallback(data)
                
                # 作成されたレコードを取得
                return self.find_by_id(created_id)
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"レコードの作成に失敗: {str(e)}")
            raise DatabaseError(
                f"レコードの作成に失敗: {str(e)}",
                error_code="CREATE_ERROR"
            )
    
    def update(self, id: Any, data: Dict[str, Any]) -> Optional[T]:
        """
        IDでレコードを更新
        
        Args:
            id: 主キー値
            data: 更新されたフィールド値を含む辞書
            
        Returns:
            更新されたモデルインスタンスまたは見つからない場合はNone
            
        Raises:
            DatabaseError: 更新が失敗した場合
            ValidationError: データ検証が失敗した場合
        """
        try:
            self._validate_update_data(data)
            
            table_name = self._get_table_name()
            set_clauses = [f"{col} = :{col}" for col in data.keys()]
            
            query = f"""
                UPDATE {table_name}
                SET {', '.join(set_clauses)}
                WHERE id = :id
            """
            
            update_data = {**data, "id": id}
            affected_rows = self.execute_update(query, update_data)
            
            if affected_rows == 0:
                return None  # レコードが見つからない
            
            return self.find_by_id(id)
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"レコード {id} の更新に失敗: {str(e)}")
            raise DatabaseError(
                f"レコードの更新に失敗: {str(e)}",
                error_code="UPDATE_ERROR"
            )
    
    def delete(self, id: Any) -> bool:
        """
        IDでレコードを削除
        
        Args:
            id: 主キー値
            
        Returns:
            レコードが削除された場合はTrue、見つからない場合はFalse
            
        Raises:
            DatabaseError: 削除が失敗した場合
        """
        try:
            table_name = self._get_table_name()
            query = f"DELETE FROM {table_name} WHERE id = :id"
            
            affected_rows = self.execute_update(query, {"id": id})
            return affected_rows > 0
            
        except Exception as e:
            logger.error(f"レコード {id} の削除に失敗: {str(e)}")
            raise DatabaseError(
                f"レコードの削除に失敗: {str(e)}",
                error_code="DELETE_ERROR"
            )
    
    def count(self) -> int:
        """
        レコードの総数をカウント
        
        Returns:
            レコードの総数
            
        Raises:
            DatabaseError: カウントクエリが失敗した場合
        """
        try:
            table_name = self._get_table_name()
            query = f"SELECT COUNT(*) as count FROM {table_name}"
            results = self.execute_query(query)
            return results[0]['count'] if results else 0
            
        except Exception as e:
            logger.error(f"レコードのカウントに失敗: {str(e)}")
            raise DatabaseError(
                f"レコードのカウントに失敗: {str(e)}",
                error_code="COUNT_ERROR"
            )
    
    def exists(self, id: Any) -> bool:
        """
        IDでレコードが存在するかチェック
        
        Args:
            id: 主キー値
            
        Returns:
            レコードが存在する場合はTrue、そうでなければFalse
            
        Raises:
            DatabaseError: チェックが失敗した場合
        """
        try:
            return self.find_by_id(id) is not None
        except Exception as e:
            logger.error(f"レコード {id} の存在チェックに失敗: {str(e)}")
            raise DatabaseError(
                f"レコードの存在チェックに失敗: {str(e)}",
                error_code="EXISTS_ERROR"
            )
    
    # サブクラスが実装する必要がある抽象メソッド
    @abstractmethod
    def _get_table_name(self) -> str:
        """このリポジトリのデータベーステーブル名を返す"""
        pass
    
    @abstractmethod
    def _map_to_model(self, data: Dict[str, Any]) -> T:
        """データベース行データをモデルインスタンスにマッピング"""
        pass
    
    # サブクラスでオーバーライドできる検証メソッド
    def _validate_create_data(self, data: Dict[str, Any]) -> None:
        """
        作成前にデータを検証
        
        Args:
            data: 検証するデータ
            
        Raises:
            ValidationError: 検証が失敗した場合
        """
        if not data:
            raise ValidationError("作成用のデータは空にできません")
    
    def _validate_update_data(self, data: Dict[str, Any]) -> None:
        """
        更新前にデータを検証
        
        Args:
            data: 検証するデータ
            
        Raises:
            ValidationError: 検証が失敗した場合
        """
        if not data:
            raise ValidationError("更新用のデータは空にできません")
    
    def _create_fallback(self, data: Dict[str, Any]) -> T:
        """
        生成されたIDを取得できない場合のフォールバック実装
        
        Args:
            data: 作成されたデータ
            
        Returns:
            作成されたモデルインスタンス(IDなし)
            
        Note:
            このメソッドはサブクラスでオーバーライドすることを推奨します。
            デフォルトでは、データから直接モデルインスタンスを作成します。
        """
        logger.warning("フォールバック方式でレコードを作成します。IDは含まれません。")
        return self._map_to_model(data)
