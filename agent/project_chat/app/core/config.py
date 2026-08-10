import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Try to load .env from project root (two levels up from this file) for local dev
project_root_env = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=os.path.abspath(project_root_env))


class DatabaseConfig(BaseSettings):
    """データベース設定"""

    host: str = Field(..., env="DATABASE_HOST")
    user: str = Field(..., env="DATABASE_USER")
    password: str = Field(..., env="DATABASE_PASSWORD")
    name: str = Field(..., env="DATABASE_NAME")
    port: int = Field(default=3306, env="DATABASE_PORT")

    # 接続プール設定
    use_pooling: bool = Field(default=True, env="DATABASE_USE_POOLING")
    pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    max_overflow: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")
    pool_recycle: int = Field(default=3600, env="DATABASE_POOL_RECYCLE")
    pool_pre_ping: bool = Field(default=True, env="DATABASE_POOL_PRE_PING")
    pool_timeout: int = Field(default=30, env="DATABASE_POOL_TIMEOUT")
    echo_sql: bool = Field(default=False, env="DATABASE_ECHO_SQL")

    class Config:
        env_prefix = "DATABASE_"


class Auth0Config(BaseSettings):
    """Auth0認証設定"""

    domain: str = Field(..., env="AUTH0_DOMAIN")
    audience: str = Field(..., env="AUTH0_AUDIENCE")
    client_id: Optional[str] = Field(default=None, env="AUTH0_CLIENT_ID")
    client_secret: Optional[str] = Field(default=None, env="AUTH0_CLIENT_SECRET")

    class Config:
        env_prefix = "AUTH0_"


class LLMConfig(BaseSettings):
    """LLM設定"""

    anthropic_model: str = Field(default="claude-3-5-haiku-20241022", env="ANTHROPIC_MODEL")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    max_tokens: int = Field(default=8192, env="ANTHROPIC_MAX_TOKENS")
    temperature: float = Field(default=0.7, env="ANTHROPIC_TEMPERATURE")

    class Config:
        env_prefix = "ANTHROPIC_"


class CORSConfig(BaseSettings):
    """CORS設定"""

    allow_origins: list[str] = Field(
        default=["http://localhost:8080", "http://localhost:8081", "http://localhost:8000"],
        env="CORS_ALLOW_ORIGINS",
    )
    allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    allow_methods: list[str] = Field(default=["GET", "POST", "PUT", "DELETE", "OPTIONS"], env="CORS_ALLOW_METHODS")
    allow_headers: list[str] = Field(
        default=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
        env="CORS_ALLOW_HEADERS",
    )
    max_age: int = Field(default=3600, env="CORS_MAX_AGE")

    class Config:
        env_prefix = "CORS_"


class ServerConfig(BaseSettings):
    """サーバー設定"""

    host: str = Field(default="0.0.0.0", env="SERVER_HOST")
    port: int = Field(default=8000, env="SERVER_PORT")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file_path: str = Field(default="/app/logs/agent.log", env="LOG_FILE_PATH")
    log_max_bytes: int = Field(default=10485760, env="LOG_MAX_BYTES")
    log_backup_count: int = Field(default=5, env="LOG_BACKUP_COUNT")

    class Config:
        env_prefix = "SERVER_"


class RedisConfig(BaseSettings):
    """キャッシュとレート制限用のRedis設定"""

    host: str = Field(default="localhost", env="REDIS_HOST")
    port: int = Field(default=6379, env="REDIS_PORT")
    db: int = Field(default=0, env="REDIS_DB")
    password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    ssl: bool = Field(default=False, env="REDIS_SSL")
    decode_responses: bool = Field(default=True, env="REDIS_DECODE_RESPONSES")
    socket_connect_timeout: int = Field(default=5, env="REDIS_SOCKET_CONNECT_TIMEOUT")
    socket_timeout: int = Field(default=5, env="REDIS_SOCKET_TIMEOUT")

    class Config:
        env_prefix = "REDIS_"


class InternalApiEndpointConfig(BaseSettings):
    """内部APIエンドポイント設定"""

    endpoint: str = Field(default="http://localhost:3000", alias="INTERNAL_API_ENDPOINT")
    api_key: Optional[str] = Field(default=None, alias="INTERNAL_API_KEY")

    class Config:
        env_prefix = ""
        env_file = "../.env"
        extra = "ignore"
        populate_by_name = True


class Config:
    """すべての設定セクションを集約するメイン設定クラス"""

    def __init__(self):
        self.database = DatabaseConfig()
        self.auth0 = Auth0Config()
        self.llm = LLMConfig()
        self.cors = CORSConfig()
        self.server = ServerConfig()
        self.redis = RedisConfig()
        self.internal_api_endpoint = InternalApiEndpointConfig()

    @property
    def is_development(self) -> bool:
        return self.server.debug or os.getenv("ENVIRONMENT", "").lower() == "development"

    @property
    def is_production(self) -> bool:
        return os.getenv("ENVIRONMENT", "").lower() == "production"


config = Config()


def get_config() -> Config:
    return config


def get_database_config() -> DatabaseConfig:
    return config.database


def get_auth0_config() -> Auth0Config:
    return config.auth0


def get_llm_config() -> LLMConfig:
    return config.llm


def get_cors_config() -> CORSConfig:
    return config.cors


def get_server_config() -> ServerConfig:
    return config.server


def get_redis_config() -> RedisConfig:
    return config.redis


def get_internal_api_config() -> InternalApiEndpointConfig:
    return config.internal_api_endpoint


