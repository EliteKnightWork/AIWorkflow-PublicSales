"""
SQLAlchemy接続プールを使用した拡張データベースクラス
接続プールを追加しながら既存のコードとの後方互換性を維持
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from mysql.connector import Error as MySQLError
from core.config import get_database_config
from core.exceptions import DatabaseError, ConfigurationError
from core.logging import get_logger

logger = get_logger("pooled_database")

class PooledDatabase:
    """SQLAlchemy connection pooling を使用したデータベース接続管理クラス"""
    
    def __init__(self):
        """プール化されたデータベース接続を初期化"""
        try:
            db_config = get_database_config()
            logger.info("プール化されたデータベース接続を初期化中", extra={
                "host": db_config.host,
                "port": db_config.port,
                "database": db_config.name,
            })
            
            # SQLAlchemy接続URL
            database_url = f"mysql+pymysql://{db_config.user}:{db_config.password}@{db_config.host}:{db_config.port}/{db_config.name}"
            
            # 接続プールを使用してエンジンを作成
            self.engine = create_engine(
                database_url,
                pool_size=db_config.pool_size,
                max_overflow=db_config.max_overflow,
                pool_pre_ping=db_config.pool_pre_ping,
                pool_recycle=db_config.pool_recycle,
                echo=db_config.echo_sql,
                pool_timeout=db_config.pool_timeout,
                pool_reset_on_return='commit'
            )
            
            # セッションファクトリーを作成
            self.SessionLocal = sessionmaker(bind=self.engine)
            
            logger.info("プール化されたデータベース接続が正常に確立されました")
            
        except Exception as e:
            logger.error(f"プール化されたデータベース接続中にエラー: {str(e)}")
            raise DatabaseError(
                f"プールを使用したデータベース接続に失敗: {str(e)}",
                error_code="DB_POOL_CONNECTION_ERROR"
            )
    
    @contextmanager
    def get_session(self):
        """SQLAlchemyセッションコンテキストマネージャー"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def execute_query(self, query: str, params: tuple = None):
        """エラーハンドリング付きでデータベースクエリを実行(SQLAlchemy使用)"""
        try:
            logger.info("プール化されたデータベースクエリを実行中", extra={
                "query": query[:100] + "..." if len(query) > 100 else query,
                "has_params": params is not None
            })
            
            with self.get_session() as session:
                # SQLAlchemy用にタプルパラメータを辞書に変換
                if params:
                    # シンプルなクエリの場合、位置パラメータでtext()を使用
                    result = session.execute(text(query), params).fetchall()
                else:
                    result = session.execute(text(query)).fetchall()
                
                # 互換性のために辞書のリストに変換
                result_list = []
                for row in result:
                    result_list.append(dict(row._mapping))
                
                logger.info(f"プール化されたクエリが正常に実行され、{len(result_list)}行を返しました")
                return result_list
                
        except Exception as e:
            logger.error(f"プール化されたクエリ実行中にエラー: {str(e)}")
            raise DatabaseError(
                f"プール化されたデータベースクエリが失敗: {str(e)}",
                error_code="DB_POOL_QUERY_ERROR"
            )
    
    def execute_update(self, query: str, params: tuple = None):
        """エラーハンドリング付きでデータベース更新を実行(SQLAlchemy使用)"""
        try:
            logger.info("プール化されたデータベース更新を実行中", extra={
                "query": query[:100] + "..." if len(query) > 100 else query,
                "has_params": params is not None
            })
            
            with self.get_session() as session:
                if params:
                    result = session.execute(text(query), params)
                else:
                    result = session.execute(text(query))
                
                affected_rows = result.rowcount
                logger.info(f"プール化された更新が正常に実行され、{affected_rows}行に影響しました")
                return affected_rows
                
        except Exception as e:
            logger.error(f"プール化された更新実行中にエラー: {str(e)}")
            raise DatabaseError(
                f"プール化されたデータベース更新が失敗: {str(e)}",
                error_code="DB_POOL_UPDATE_ERROR"
            )
    
    def get_raw_connection(self):
        """既存のコードとの互換性のための生の接続を取得"""
        return self.engine.raw_connection()
    
    def close(self):
        """データベース接続プールを閉じる"""
        try:
            if hasattr(self, 'engine'):
                self.engine.dispose()
                logger.info("プール化されたデータベース接続プールが正常に閉じられました")
        except Exception as e:
            logger.error(f"プール化されたデータベース接続を閉じる際にエラー: {str(e)}")
    
    def __del__(self):
        """オブジェクトが破棄される際に接続プールが閉じられることを保証"""
        self.close()

# 後方互換性: プールを使用するDatabaseクラスを作成
class Database(PooledDatabase):
    """接続プールを使用する後方互換性のあるDatabaseクラス"""
    pass
