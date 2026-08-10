"""
接続プール実装を切り替えるためのデータベースファクトリー
"""
from core.config import get_database_config

def get_database():
    """
    データベースインスタンスを取得するファクトリー関数
    デフォルトで接続プールを使用し、必要に応じて元の実装にフォールバック
    """
    db_config = get_database_config()
    
    if db_config.use_pooling:
        from .pooled_database import PooledDatabase
        return PooledDatabase()
    else:
        # 非プールでもSQLAlchemy経由の統一実装を使用
        from .pooled_database import PooledDatabase
        return PooledDatabase()

# 注意: Database クラスは pooled_database.py で定義されています
# このファイルでは get_database() 関数を使用してください
