from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from core.config import get_database_config

class DatabaseManager:
    """データベース接続管理クラス"""
    
    def __init__(self, database_url: str = None):
        """データベースマネージャーを初期化"""
        if database_url is None:
            db_config = get_database_config()
            database_url = f"mysql+pymysql://{db_config.user}:{db_config.password}@{db_config.host}:{db_config.port}/{db_config.name}"
        else:
            db_config = get_database_config()
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
        self.SessionLocal = sessionmaker(bind=self.engine)

    @contextmanager
    def get_session(self):
        """データベースセッションを取得するコンテキストマネージャー"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def get_session_dependency(self):
        """FastAPI用のデータベースセッション取得依存関数"""
        with self.get_session() as session:
            yield session

db_manager = DatabaseManager()
